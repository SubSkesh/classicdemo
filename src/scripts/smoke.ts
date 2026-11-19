/**
 * Fumo illuminato dalla fessura, in un unico fragment shader (WebGL 1, nessuna libreria).
 * Solo desktop: su mobile e con reduced motion resta la foschia CSS.
 * Renderizza a mezza risoluzione (il fumo è morbido, nessuno lo nota) e si ferma fuori viewport.
 */
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision mediump float;
uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uI;uniform float uOpen;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.;float a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float t=uTime*.055;
  float lean=(uMouse.x-.5)*.16*(1.-abs(p.y));
  float dx=p.x-lean;
  vec2 q=vec2(p.x*1.35,p.y-t*1.5);
  vec2 w=vec2(fbm(q*1.5+t),fbm(q*1.5-t+4.2));
  float s=fbm(q*2.3+w*1.9);
  float smoke=smoothstep(.32,.95,s);
  float spread=mix(3.6,1.6,uOpen);
  float halo=exp(-abs(dx)*spread);
  float core=exp(-abs(dx)*30.);
  float vert=smoothstep(1.15,0.,abs(p.y+.04));
  vec3 cTop=vec3(1.,.18,.44);vec3 cMid=vec3(.71,.30,1.);vec3 cBot=vec3(.36,.88,.90);
  vec3 col=mix(cBot,cMid,smoothstep(0.,.55,uv.y));col=mix(col,cTop,smoothstep(.5,1.,uv.y));
  vec3 tint=mix(vec3(.95,.94,.92),col,smoothstep(.015,.32,abs(dx)));
  vec3 light=tint*(halo*smoke*.85+core*.28)*vert;
  light+=vec3(.05,.045,.065)*smoke*(1.-smoothstep(0.,.9,abs(dx)));
  vec2 m=(uMouse-.5)*vec2(uRes.x/uRes.y,1.);
  light+=col*.12*smoke*exp(-length(p-m)*3.2);
  gl_FragColor=vec4(light*uI,1.);
}`;

export type Smoke = {
  render: (timeSec: number) => void;
  set: (k: 'intensity' | 'open', v: number) => void;
  pointer: (x: number, y: number) => void;
  resize: () => void;
  destroy: () => void;
  state: { intensity: number; open: number };
};

export function createSmoke(canvas: HTMLCanvasElement, scale = 0.5): Smoke | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(prog, 'uRes'),
    time: gl.getUniformLocation(prog, 'uTime'),
    mouse: gl.getUniformLocation(prog, 'uMouse'),
    i: gl.getUniformLocation(prog, 'uI'),
    open: gl.getUniformLocation(prog, 'uOpen'),
  };

  const state = { intensity: 0, open: 0 };
  const mouse = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6 };

  const resize = () => {
    const w = Math.max(2, Math.round(canvas.clientWidth * scale));
    const h = Math.max(2, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  resize();

  return {
    state,
    render(time) {
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1f(u.i, state.intensity);
      gl.uniform1f(u.open, state.open);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    set(k, v) {
      state[k] = v;
    },
    pointer(x, y) {
      mouse.tx = x;
      mouse.ty = y;
    },
    resize,
    destroy() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
