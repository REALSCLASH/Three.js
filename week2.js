import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

let container, camera, scene, renderer, cube, axesHelper, controls;

init();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(2, 2, 2);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.AmbientLight(0x604040);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(directionalLight);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({ color: 0xff40000 });
  cube = new THREE.Mesh(geometry, material);

  cube.position.x = 3;
  cube.scale.set(1, 1, 1);
  cube.rotation.y = Math.PI / 3;

  scene.add(cube);

  camera.lookAt(new THREE.Vector3(0, 0, 0));

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  loadmodels();
}

function loadmodels() {
  new RGBELoader()
    .setPath("/")
    .load("cobblestone_street_night_1k.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      const loader = new GLTFLoader().setPath("/");
      loader.load("barrel.gltf", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        scene.add(model);
      });

      const loader2 = new GLTFLoader().setPath("/");
      loader2.load(".gltf", async function (gltf) {
        const model2 = gltf.scene;

        await renderer.compileAsync(model2, camera, scene);

        scene.add(model2);
      });
    });
}

animate();

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  controls.update();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.addEventListener("resize", resize, false);
