import Link from "next/link";
import { notFound } from "next/navigation";
import { DecisionForm } from "@/components/command/decision-form";
import { CommandPage, KeyValue, Panel } from "@/components/command/page";
import { requireStaff } from "@/lib/auth/session";
import { staffRepository } from "@/lib/data";
import { NotFoundError } from "@/lib/data/repository";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Application" };

const QUESTIONS: Record<string, string> = {
  lifeInMotion: "How does your life move?",
  whatWouldHelp: "What would make it easier?",
};

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await requireStaff();
  const repo = await staffRepository(identity);
  const a = await repo.getApplication(id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  return (
    <CommandPage
      eyebrow={
        <Link href="/command/applications" className="hover:text-bone-200">
          ← Applications
        </Link>
      }
      title={a.fullName}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-6">
          {Object.entries(a.answers).map(([k, v]) => (
            <Panel key={k} title={QUESTIONS[k] ?? k}>
              <p className="text-body whitespace-pre-line text-bone-100">{v}</p>
            </Panel>
          ))}
        </div>
        <aside className="grid content-start gap-6">
          <Panel title="Applicant">
            <KeyValue
              items={[
                ["Email", a.email],
                ["Phone", a.phone],
                ["City", a.city],
                ["Market", a.marketSlug],
                ["Occupation", a.occupation],
                ["Heard via", a.referralSource],
                ["Invitation", a.invitationCode],
                ["Submitted", formatDateTime(a.submittedAt)],
              ]}
            />
          </Panel>
          <Panel title="Decision">
            <DecisionForm applicationId={a.id} status={a.status} note={a.decisionNote} />
          </Panel>
        </aside>
      </div>
    </CommandPage>
  );
}
