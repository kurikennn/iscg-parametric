import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { sampleBezierPolyline } from "./curves/bezier.js";
import { sampleCatmullRomOpenPolyline } from "./curves/catmullRom.js";

const BEZIER_SAMPLES = 160;
const CR_SAMPLES_PER_SEG = 24;

/** 初期制御点（XZ 平面、Y=0） */
function initialControlPoints() {
  return [
    new Vector3(-3.2, 0, -1.2),
    new Vector3(-1.8, 0, 2.4),
    new Vector3(0.6, 0, -0.4),
    new Vector3(2.2, 0, 1.8),
    new Vector3(3.6, 0, -1.6),
  ];
}

function disposeLineGeometry(line) {
  const g = line.geometry;
  if (g) g.dispose();
}

function setLinePositions(line, points) {
  disposeLineGeometry(line);
  const pos = new Float32Array(points.length * 3);
  for (let i = 0; i < points.length; i++) {
    pos[i * 3] = points[i].x;
    pos[i * 3 + 1] = points[i].y;
    pos[i * 3 + 2] = points[i].z;
  }
  const geom = new BufferGeometry();
  geom.setAttribute("position", new BufferAttribute(pos, 3));
  line.geometry = geom;
}

const container = document.getElementById("app");
const scene = new Scene();
scene.background = new Color(0x1a2230);

const camera = new PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 9, 11);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.mouseButtons = {
  LEFT: null,
  MIDDLE: null,
  RIGHT: 0,
};
controls.update();

const ambient = new AmbientLight(0xffffff, 0.35);
scene.add(ambient);
const dir = new DirectionalLight(0xffffff, 0.85);
dir.position.set(4, 12, 6);
scene.add(dir);

const ground = new Mesh(
  new PlaneGeometry(40, 40),
  new MeshStandardMaterial({
    color: 0x1a2230,
    metalness: 0.1,
    roughness: 0.95,
    side: DoubleSide,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

const controlPoints = initialControlPoints();
const cpGroup = new Group();
const sphereGeom = new SphereGeometry(0.14, 24, 16);
const sphereMat = new MeshStandardMaterial({
  color: 0x90a4ae,
  metalness: 0.2,
  roughness: 0.45,
});
const cpMeshes = [];
for (let i = 0; i < controlPoints.length; i++) {
  const m = new Mesh(sphereGeom, sphereMat);
  m.userData.index = i;
  m.position.copy(controlPoints[i]);
  cpGroup.add(m);
  cpMeshes.push(m);
}
scene.add(cpGroup);

const hullMat = new LineBasicMaterial({ color: 0x546e7a });
const hullLine = new Line(new BufferGeometry(), hullMat);
scene.add(hullLine);

const bezierMat = new LineBasicMaterial({ color: 0x4fc3f7, linewidth: 1 });
const bezierLine = new Line(new BufferGeometry(), bezierMat);
scene.add(bezierLine);

const crMat = new LineBasicMaterial({ color: 0xffb74d, linewidth: 1 });
const crLine = new Line(new BufferGeometry(), crMat);
scene.add(crLine);

const bezierScratch = [];
const crScratch = [];

function rebuildGeometry() {
  const pts = controlPoints;

  const hullPts = [...pts];
  setLinePositions(hullLine, hullPts);

  sampleBezierPolyline(pts, BEZIER_SAMPLES, bezierScratch);
  setLinePositions(bezierLine, bezierScratch);

  sampleCatmullRomOpenPolyline(pts, CR_SAMPLES_PER_SEG, crScratch);
  setLinePositions(crLine, crScratch);

  for (let i = 0; i < cpMeshes.length; i++) {
    cpMeshes[i].position.copy(controlPoints[i]);
  }
}

rebuildGeometry();

const raycaster = new Raycaster();
const pointer = new Vector2();
const dragPlane = new Vector3(0, 1, 0);
let draggingIndex = -1;

function pointerToNDC(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function pickControlPoint(clientX, clientY) {
  pointerToNDC(clientX, clientY);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(cpMeshes, false);
  if (hits.length === 0) return -1;
  return hits[0].object.userData.index;
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  const idx = pickControlPoint(e.clientX, e.clientY);
  if (idx < 0) return;
  draggingIndex = idx;
  controls.enabled = false;
  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener("pointermove", (e) => {
  if (draggingIndex < 0) return;
  pointerToNDC(e.clientX, e.clientY);
  raycaster.setFromCamera(pointer, camera);
  const origin = raycaster.ray.origin;
  const dirRay = raycaster.ray.direction;
  const denom = dirRay.dot(dragPlane);
  if (Math.abs(denom) < 1e-6) return;
  const tHit = -origin.dot(dragPlane) / denom;
  const p = origin.clone().addScaledVector(dirRay, tHit);
  p.y = 0;
  controlPoints[draggingIndex].copy(p);
  rebuildGeometry();
});

function endDrag(e) {
  if (draggingIndex < 0) return;
  draggingIndex = -1;
  controls.enabled = true;
  try {
    renderer.domElement.releasePointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
}

renderer.domElement.addEventListener("pointerup", endDrag);
renderer.domElement.addEventListener("pointercancel", endDrag);

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", onResize);
onResize();

function tick() {
  requestAnimationFrame(tick);
  controls.update();
  renderer.render(scene, camera);
}
tick();
