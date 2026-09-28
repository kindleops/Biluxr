/**
 * Database security and lifecycle tests. Run via `npm run test:db`, which
 * provisions a disposable Postgres with every migration applied.
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import pg from "pg";

const db = new pg.Client();

/** Run `fn` inside a transaction as the given Supabase identity. */
async function as(identity, fn) {
  await db.query("begin");
  try {
    if (identity === "anon") {
      await db.query("set local role anon");
      await db.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
    } else if (identity) {
      await db.query("set local role authenticated");
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [
        JSON.stringify({ sub: identity, role: "authenticated" }),
      ]);
    }
    const result = await fn();
    await db.query("commit");
    return result;
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}

async function rejects(promise, pattern) {
  await assert.rejects(promise, (err) => {
    if (pattern) assert.match(String(err.message), pattern);
    return true;
  });
}

async function createUser(email, fullName = "") {
  const { rows } = await db.query(
    "insert into auth.users (email, raw_user_meta_data) values ($1, jsonb_build_object('full_name', $2::text)) returning id",
    [email, fullName],
  );
  return rows[0].id;
}

let adminId, conciergeId, memberA, memberB, pendingMember;
let requestA;

before(async () => {
  await db.connect();

  adminId = await createUser("admin@biluxr.test", "Ada Admin");
  conciergeId = await createUser("concierge@biluxr.test", "Celia Concierge");
  await db.query("update public.profiles set role = 'admin' where id = $1", [adminId]);
  await db.query("update public.profiles set role = 'concierge' where id = $1", [conciergeId]);

  // Approved applicants become members on first sign-in.
  for (const email of ["a@member.test", "b@member.test", "pending@member.test"]) {
    await db.query(
      "insert into public.applications (full_name, email, city, status, decided_at) values ($1, $2, 'Miami', 'approved', now())",
      [`Member ${email.split("@")[0]}`, email],
    );
  }
  memberA = await createUser("a@member.test");
  memberB = await createUser("b@member.test");
  pendingMember = await createUser("pending@member.test");
  await db.query(
    "update public.memberships set status = 'active', started_at = now() where member_id = any($1)",
    [[memberA, memberB]],
  );
});

after(async () => {
  await db.end();
});

describe("configuration", () => {
  test("seed publishes markets without claiming any are active", async () => {
    const rows = await as(
      "anon",
      async () => (await db.query("select slug, status from public.markets")).rows,
    );
    assert.equal(rows.length, 14);
    assert.equal(rows.filter((r) => r.status === "active").length, 0);
    assert.equal(rows.find((r) => r.slug === "miami").status, "preparing");
  });

  test("tier fees are unpublished (null) rather than invented", async () => {
    const rows = await as(
      "anon",
      async () => (await db.query("select annual_fee_minor from public.membership_tiers")).rows,
    );
    assert.ok(rows.length >= 1);
    assert.ok(rows.every((r) => r.annual_fee_minor === null));
  });

  test("fee rules and SLA targets are hidden from members and anonymous visitors", async () => {
    const anon = await as(
      "anon",
      async () => (await db.query("select * from public.fee_rules")).rows,
    );
    const member = await as(
      memberA,
      async () => (await db.query("select * from public.service_level_targets")).rows,
    );
    const staff = await as(
      conciergeId,
      async () => (await db.query("select * from public.fee_rules")).rows,
    );
    assert.equal(anon.length, 0);
    assert.equal(member.length, 0);
    assert.ok(staff.length > 0);
  });

  test("only admins can change configuration", async () => {
    await rejects(
      as(conciergeId, () =>
        db.query(
          "insert into public.markets (slug, name, region, timezone) values ('x','X','X','UTC')",
        ),
      ),
      /row-level security/,
    );
    await as(adminId, () =>
      db.query("update public.markets set status = 'preparing' where slug = 'new-york'"),
    );
    await db.query("update public.markets set status = 'planned' where slug = 'new-york'");
  });
});

describe("identity & roles", () => {
  test("new users without an approved application are applicants", async () => {
    const id = await createUser("stranger@example.test");
    const { rows } = await db.query("select role from public.profiles where id = $1", [id]);
    assert.equal(rows[0].role, "applicant");
    const memberships = await db.query("select 1 from public.memberships where member_id = $1", [
      id,
    ]);
    assert.equal(memberships.rowCount, 0);
  });

  test("approved applicants become members with a pending membership and a member number", async () => {
    const { rows } = await db.query(
      "select p.role, m.status, m.member_number from public.profiles p join public.memberships m on m.member_id = p.id where p.id = $1",
      [pendingMember],
    );
    assert.equal(rows[0].role, "member");
    assert.equal(rows[0].status, "pending_activation");
    assert.match(rows[0].member_number, /^\d{4}$/);
  });

  test("members cannot escalate their own role", async () => {
    await rejects(
      as(memberA, () =>
        db.query("update public.profiles set role = 'admin' where id = $1", [memberA]),
      ),
      /insufficient_privilege/,
    );
  });

  test("members can edit their own name but not other profiles", async () => {
    await as(memberA, () =>
      db.query("update public.profiles set preferred_name = 'Alex' where id = $1", [memberA]),
    );
    const res = await as(memberA, () =>
      db.query("update public.profiles set preferred_name = 'Hijack' where id = $1", [memberB]),
    );
    assert.equal(res.rowCount, 0);
  });

  test("members cannot read other members' profiles", async () => {
    const rows = await as(
      memberA,
      async () => (await db.query("select id from public.profiles")).rows,
    );
    assert.deepEqual(
      rows.map((r) => r.id),
      [memberA],
    );
  });

  test("admins can change roles and the change is audited", async () => {
    const id = await createUser("promote@example.test");
    await as(adminId, () =>
      db.query("update public.profiles set role = 'provider' where id = $1", [id]),
    );
    const { rows } = await db.query(
      "select actor_id, meta from public.audit_log where entity = 'profiles' and entity_id = $1",
      [id],
    );
    assert.equal(rows.at(-1).actor_id, adminId);
    assert.equal(rows.at(-1).meta.role.to, "provider");
  });
});

describe("applications", () => {
  test("anonymous visitors can apply but cannot read or pre-approve", async () => {
    await as("anon", () =>
      db.query(
        "insert into public.applications (full_name, email, city) values ('Jo Visitor', 'jo@example.test', 'Miami')",
      ),
    );
    const read = await as(
      "anon",
      async () => (await db.query("select * from public.applications")).rows,
    );
    assert.equal(read.length, 0);
    await rejects(
      as("anon", () =>
        db.query(
          "insert into public.applications (full_name, email, city, status) values ('Jo', 'jo2@example.test', 'Miami', 'approved')",
        ),
      ),
      /row-level security/,
    );
  });

  test("members cannot see applications; staff can", async () => {
    const member = await as(
      memberA,
      async () => (await db.query("select * from public.applications")).rows,
    );
    const staff = await as(
      conciergeId,
      async () => (await db.query("select * from public.applications")).rows,
    );
    assert.equal(member.length, 0);
    assert.ok(staff.length >= 4);
  });
});

describe("requests", () => {
  test("members without an active membership cannot create requests", async () => {
    await rejects(
      as(pendingMember, () =>
        db.query(
          "insert into public.requests (member_id, title, brief) values ($1, 'Dinner', 'Table for two')",
          [pendingMember],
        ),
      ),
      /row-level security/,
    );
  });

  test("active members create requests; SLA deadline and creation event are stamped", async () => {
    const { rows } = await as(memberA, () =>
      db.query(
        "insert into public.requests (member_id, title, brief, priority, status) values ($1, 'Dinner Friday', 'A quiet table for four', 'priority', 'completed') returning id, status, first_response_due_at, created_at",
        [memberA],
      ),
    );
    requestA = rows[0].id;
    assert.equal(rows[0].status, "received", "status is forced to received on insert");
    const minutes =
      (new Date(rows[0].first_response_due_at) - new Date(rows[0].created_at)) / 60000;
    assert.equal(Math.round(minutes), 60);
    const events = await db.query("select kind from public.request_events where request_id = $1", [
      requestA,
    ]);
    assert.deepEqual(
      events.rows.map((r) => r.kind),
      ["created"],
    );
  });

  test("members cannot create requests for someone else or pre-assign staff", async () => {
    await rejects(
      as(memberA, () =>
        db.query("insert into public.requests (member_id, title, brief) values ($1, 'x', 'y')", [
          memberB,
        ]),
      ),
      /row-level security/,
    );
    await rejects(
      as(memberA, () =>
        db.query(
          "insert into public.requests (member_id, title, brief, assignee_id) values ($1, 'x', 'y', $2)",
          [memberA, conciergeId],
        ),
      ),
      /row-level security/,
    );
  });

  test("members see only their own requests", async () => {
    const mine = await as(
      memberA,
      async () => (await db.query("select id from public.requests")).rows,
    );
    const theirs = await as(
      memberB,
      async () => (await db.query("select id from public.requests")).rows,
    );
    assert.equal(mine.length, 1);
    assert.equal(theirs.length, 0);
  });

  test("members cannot update requests directly", async () => {
    const res = await as(memberA, () =>
      db.query("update public.requests set status = 'sourcing' where id = $1", [requestA]),
    );
    assert.equal(res.rowCount, 0);
  });

  test("staff transitions follow the lifecycle graph", async () => {
    await rejects(
      as(conciergeId, () =>
        db.query("update public.requests set status = 'completed' where id = $1", [requestA]),
      ),
      /invalid request transition/,
    );
    await as(conciergeId, () =>
      db.query("update public.requests set status = 'sourcing', assignee_id = $2 where id = $1", [
        requestA,
        conciergeId,
      ]),
    );
    const events = await db.query(
      "select kind, from_status, to_status, actor_id from public.request_events where request_id = $1 order by created_at",
      [requestA],
    );
    const change = events.rows.find((e) => e.kind === "status_changed");
    assert.equal(change.from_status, "received");
    assert.equal(change.to_status, "sourcing");
    assert.equal(change.actor_id, conciergeId);
    assert.ok(events.rows.some((e) => e.kind === "assigned"));
  });
});

describe("messages", () => {
  test("internal notes are invisible to members", async () => {
    await as(conciergeId, () =>
      db.query(
        "insert into public.request_messages (request_id, author_id, author_kind, body, visibility) values ($1, $2, 'concierge', 'Prefers the corner table; do not mention budget.', 'internal')",
        [requestA, conciergeId],
      ),
    );
    await as(conciergeId, () =>
      db.query(
        "insert into public.request_messages (request_id, author_id, author_kind, body, visibility) values ($1, $2, 'concierge', 'On it. Two options by this evening.', 'member')",
        [requestA, conciergeId],
      ),
    );
    const seen = await as(
      memberA,
      async () => (await db.query("select body, author_name from public.request_messages")).rows,
    );
    assert.equal(seen.length, 1);
    assert.equal(seen[0].body, "On it. Two options by this evening.");
    assert.equal(seen[0].author_name, "Celia Concierge", "author name derives from profile");
  });

  test("first member-visible staff reply stamps first response", async () => {
    const { rows } = await db.query(
      "select first_responded_at from public.requests where id = $1",
      [requestA],
    );
    assert.ok(rows[0].first_responded_at);
  });

  test("members cannot post internal notes or impersonate staff", async () => {
    await rejects(
      as(memberA, () =>
        db.query(
          "insert into public.request_messages (request_id, author_id, author_kind, body, visibility) values ($1, $2, 'member', 'x', 'internal')",
          [requestA, memberA],
        ),
      ),
      /row-level security/,
    );
    await rejects(
      as(memberA, () =>
        db.query(
          "insert into public.request_messages (request_id, author_id, author_kind, body) values ($1, $2, 'concierge', 'x')",
          [requestA, memberA],
        ),
      ),
      /row-level security/,
    );
  });

  test("other members cannot write into a request", async () => {
    await rejects(
      as(memberB, () =>
        db.query(
          "insert into public.request_messages (request_id, author_id, author_kind, body) values ($1, $2, 'member', 'x')",
          [requestA, memberB],
        ),
      ),
      /row-level security/,
    );
  });
});

describe("options", () => {
  let optionOne, optionTwo;

  test("draft options are hidden until presented", async () => {
    const { rows } = await as(conciergeId, () =>
      db.query(
        "insert into public.request_options (request_id, title, status, price_minor, price_currency) values ($1, 'Option one', 'draft', 42000, 'USD'), ($1, 'Option two', 'presented', null, null) returning id",
        [requestA],
      ),
    );
    [optionOne, optionTwo] = rows.map((r) => r.id);
    const visible = await as(
      memberA,
      async () => (await db.query("select id from public.request_options")).rows,
    );
    assert.deepEqual(
      visible.map((r) => r.id),
      [optionTwo],
    );
  });

  test("members cannot respond to someone else's option", async () => {
    await rejects(
      as(memberB, () =>
        db.query("select public.member_respond_to_option($1, 'accept')", [optionTwo]),
      ),
      /option not found/,
    );
  });

  test("members cannot respond to a draft option", async () => {
    await rejects(
      as(memberA, () =>
        db.query("select public.member_respond_to_option($1, 'accept')", [optionOne]),
      ),
      /no longer open/,
    );
  });

  test("accepting an option records the decision but does not claim confirmation", async () => {
    await as(memberA, () =>
      db.query("select public.member_respond_to_option($1, 'accept')", [optionTwo]),
    );
    const { rows } = await db.query(
      "select o.status as option_status, r.status as request_status from public.request_options o join public.requests r on r.id = o.request_id where o.id = $1",
      [optionTwo],
    );
    assert.equal(rows[0].option_status, "accepted");
    assert.equal(rows[0].request_status, "sourcing", "only staff confirm with the provider");
  });

  test("a second acceptance on the same request is refused", async () => {
    await as(conciergeId, () =>
      db.query("update public.request_options set status = 'presented' where id = $1", [optionOne]),
    );
    await rejects(
      as(memberA, () =>
        db.query("select public.member_respond_to_option($1, 'accept')", [optionOne]),
      ),
      /already been chosen/,
    );
  });
});

describe("staff-only records", () => {
  test("providers and AI events are invisible to members", async () => {
    await db.query(
      "insert into public.providers (name, status) values ('Test Provider', 'vetting')",
    );
    await db.query(
      "insert into public.ai_events (kind, request_id, model, prompt_version, output) values ('intent_extraction', $1, 'test', 'v1', '{}')",
      [requestA],
    );
    const providers = await as(
      memberA,
      async () => (await db.query("select * from public.providers")).rows,
    );
    const ai = await as(
      memberA,
      async () => (await db.query("select * from public.ai_events")).rows,
    );
    assert.equal(providers.length, 0);
    assert.equal(ai.length, 0);
    const staffAi = await as(
      conciergeId,
      async () => (await db.query("select * from public.ai_events")).rows,
    );
    assert.equal(staffAi.length, 1);
  });

  test("members cannot forge AI events", async () => {
    await rejects(
      as(memberA, () =>
        db.query(
          "insert into public.ai_events (kind, request_id, model, prompt_version) values ('summary', $1, 'x', 'x')",
          [requestA],
        ),
      ),
      /row-level security/,
    );
  });

  test("access offers: drafts hidden, published visible only to active members", async () => {
    await db.query(
      "insert into public.access_offers (title, status) values ('Draft offer', 'draft'), ('Published offer', 'published')",
    );
    const active = await as(
      memberA,
      async () => (await db.query("select title from public.access_offers")).rows,
    );
    const pending = await as(
      pendingMember,
      async () => (await db.query("select title from public.access_offers")).rows,
    );
    const anon = await as(
      "anon",
      async () => (await db.query("select title from public.access_offers")).rows,
    );
    assert.deepEqual(
      active.map((r) => r.title),
      ["Published offer"],
    );
    assert.equal(pending.length, 0);
    assert.equal(anon.length, 0);
  });
});

describe("invitations", () => {
  test("pending members cannot issue invitations", async () => {
    await rejects(
      as(pendingMember, () =>
        db.query("select * from public.member_issue_invitation('x@example.test', 'X')"),
      ),
      /active membership/,
    );
  });

  test("active members issue up to their allowance; codes are stored hashed", async () => {
    const codes = [];
    for (let i = 0; i < 3; i++) {
      const { rows } = await as(memberA, () =>
        db.query("select * from public.member_issue_invitation($1, 'Guest')", [
          `guest${i}@example.test`,
        ]),
      );
      codes.push(rows[0].code);
    }
    await rejects(
      as(memberA, () =>
        db.query("select * from public.member_issue_invitation('g4@example.test', 'Guest')"),
      ),
      /allowance reached/,
    );
    const stored = await db.query(
      "select code_hash, code_hint from public.invitations where inviter_id = $1",
      [memberA],
    );
    assert.equal(stored.rowCount, 3);
    for (const row of stored.rows) {
      assert.ok(!codes.includes(row.code_hash));
      assert.equal(row.code_hash.length, 64);
    }
    const valid = await as(
      "anon",
      async () =>
        (await db.query("select public.check_invitation($1) as ok", [codes[0].toLowerCase()])).rows,
    );
    assert.equal(valid[0].ok, true);
    const invalid = await as(
      "anon",
      async () => (await db.query("select public.check_invitation('NOPE') as ok")).rows,
    );
    assert.equal(invalid[0].ok, false);
  });

  test("members see only their own invitations", async () => {
    const b = await as(
      memberB,
      async () => (await db.query("select * from public.invitations")).rows,
    );
    assert.equal(b.length, 0);
  });
});

describe("member cancellation", () => {
  test("members can withdraw an open request, not someone else's", async () => {
    const { rows } = await as(memberB, () =>
      db.query(
        "insert into public.requests (member_id, title, brief) values ($1, 'Car', 'Airport pickup') returning id",
        [memberB],
      ),
    );
    const id = rows[0].id;
    await rejects(
      as(memberA, () => db.query("select public.member_cancel_request($1)", [id])),
      /not found/,
    );
    await as(memberB, () =>
      db.query("select public.member_cancel_request($1, 'Plans changed')", [id]),
    );
    const after = await db.query("select status from public.requests where id = $1", [id]);
    assert.equal(after.rows[0].status, "cancelled");
  });
});

describe("analytics", () => {
  test("anyone may record events; only admins may read them", async () => {
    await as("anon", () =>
      db.query(
        "insert into public.analytics_events (name, properties) values ('page.view', '{\"path\":\"/\"}')",
      ),
    );
    await rejects(
      as("anon", () => db.query("insert into public.analytics_events (name) values ('Bad Name!')")),
      /check constraint/,
    );
    const member = await as(
      memberA,
      async () => (await db.query("select * from public.analytics_events")).rows,
    );
    const admin = await as(
      adminId,
      async () => (await db.query("select * from public.analytics_events")).rows,
    );
    assert.equal(member.length, 0);
    assert.equal(admin.length, 1);
  });
});
