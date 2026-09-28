/**
 * Fragment shaders (GLSL ES 1.00, so they run on WebGL 1 and 2).
 * Shared value noise + fbm; each shader keeps its octave count low enough to
 * hold frame rate on integrated GPUs at the render scales we use.
 */

const NOISE = /* glsl */ `
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
`;

/**
 * Liquid silk: a slowly folding sheet of dark cloth lit by a single soft lamp.
 * Height comes from domain-warped fbm; a normal from finite differences gives
 * the specular sheen. `uPointer` moves the lamp slightly; `uTint` warms the
 * highlights; `uIntensity` sets how much light is in the room.
 */
export const SILK_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uIntensity;
uniform vec3 uTint;
uniform vec3 uBase;
${NOISE}
float field(vec2 p,float t){
  vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t*.8));
  return fbm(p+1.9*q+vec2(t*.3,-t*.2));
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y)*1.7;
  float t=uTime*.05;
  vec2 sp=vec2(p.x*.5+p.y*.28,p.y*1.05-p.x*.1);
  float e=.015;
  float h=field(sp,t);
  float hx=field(sp+vec2(e,0.),t);
  float hy=field(sp+vec2(0.,e),t);
  vec3 n=normalize(vec3((h-hx)/e*.55,(h-hy)/e*.55,1.));
  vec3 L=normalize(vec3(-.45+(uPointer.x-.5)*.5,.55-(uPointer.y-.5)*.5,.8));
  float diff=clamp(dot(n,L),0.,1.);
  vec3 H=normalize(L+vec3(0.,0.,1.));
  float spec=pow(clamp(dot(n,H),0.,1.),28.);
  float sheen=pow(1.-n.z,1.35);
  vec3 cool=vec3(.66,.70,.78);
  vec3 light=mix(uTint,cool,smoothstep(.35,.75,h));
  vec3 col=uBase*(.6+diff*1.4);
  col+=light*(spec*.5+sheen*.22)*uIntensity;
  float vig=smoothstep(1.2,.1,length((uv-vec2(.5,.55))*vec2(1.1,1.25)));
  col*=mix(.3,1.,vig);
  col+=(hash(gl_FragCoord.xy+fract(uTime*7.))-.5)/180.;
  gl_FragColor=vec4(col,1.);
}
`;

/**
 * The Biluxr orb: a pearl of slow liquid colour. The interior flows along a
 * swirl that tightens with `uEnergy`; a fresnel rim and a soft key light give
 * it volume; `uRing` (0→1) sends a single ring outward when a request leaves.
 * Output is premultiplied so the halo adds light to whatever is behind it.
 */
export const ORB_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uEnergy;
uniform float uPhase;
uniform float uRing;
uniform float uHalo;
${NOISE}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
void main(){
  float px=.5*min(uRes.x,uRes.y);
  vec2 p=(gl_FragCoord.xy-.5*uRes)/px;
  float breath=.012*sin(uTime*1.1)+.008*sin(uTime*.37);
  float R=.56+.05*uEnergy+breath;
  float r=length(p);
  vec3 col=vec3(0.);
  float alpha=0.;
  if(r<R+.01){
    vec2 s=p/R;
    float z=sqrt(max(1.-dot(s,s),0.));
    float ph=uPhase;
    vec2 q=s*(1.1+.35*(1.-z));
    q=rot(ph*.5+(1.-z)*(1.6+2.2*uEnergy))*q;
    vec2 w=vec2(fbm(q*1.7+vec2(ph*.35,0.)),fbm(q*1.7+vec2(4.1,-ph*.3)));
    float f=fbm(q*1.25+2.6*w+vec2(0.,ph*.15));
    vec3 pal=.58+.42*cos(6.2831*(vec3(0.,.1,.22)+f*.85+w.x*.45+ph*.03));
    float grey=dot(pal,vec3(.333));
    pal=mix(vec3(grey),pal,.5+.3*uEnergy);
    vec3 inner=pal*(.22+1.2*f*f)*(.62+.55*uEnergy);
    float depth=mix(.25,1.,z);
    float fres=pow(1.-z,2.2);
    vec3 rim=mix(vec3(.96,.94,.9),pal,.35)*fres*(.75+.7*uEnergy);
    vec2 hl=s-vec2(-.34,.42);
    float key=exp(-dot(hl,hl)*9.)*.42;
    col=inner*depth+rim+key*vec3(1.,.98,.95);
    float edge=smoothstep(R,R-1.6/px,r);
    alpha=edge;
    col*=edge;
  }
  float out_=max(r-R,0.);
  float halo=exp(-out_*(8.-3.5*uEnergy))*(.1+.32*uEnergy)*uHalo*smoothstep(.98,.72,r);
  vec3 haloCol=mix(vec3(.9,.86,.8),vec3(.72,.78,.94),.5+.5*sin(uPhase*.35));
  col+=haloCol*halo*(1.-alpha);
  if(uRing>0.){
    float rr=R+uRing*.3;
    float ring=exp(-abs(r-rr)*px*.06)*(1.-uRing)*(1.-uRing)*smoothstep(.98,.8,r);
    col+=vec3(.95,.93,.9)*ring*.7;
    alpha=max(alpha,ring*.4);
  }
  alpha=max(alpha,halo*.6);
  gl_FragColor=vec4(col,clamp(alpha,0.,1.));
}
`;
