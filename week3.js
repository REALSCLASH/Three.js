import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

let container, camera, scene, renderer, controls;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let group = new THREE.Group(); // Create a new empty group
group.name = 'Interaction-Group'; // Set group name

// Initialize teleport variables and group
let marker, baseReferenceSpace;
let INTERSECTION = [];
let teleportgroup = new THREE.Group(); // Create a new empty group for teleportable models
teleportgroup.name = 'Teleport-Group';

init();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
  );
  camera.position.set(2, 2, 2);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x400080, 10);
  scene.add(ambientLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  loadModels();

  initVR();

  renderer.xr.enabled = true;

  setupControllers();

  scene.add(group);
  scene.add(teleportgroup);

  marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x808080 })
  );
  scene.add(marker);

  renderer.setAnimationLoop(function () {
      cleanIntersected();
      intersectObjects(controller1);
      intersectObjects(controller2);
      moveMarker();
      controls.update();
      renderer.render(scene, camera);
  });

  window.addEventListener('resize', onWindowResize);

  renderer.xr.addEventListener(
      'sessionstart',
      () => (baseReferenceSpace = renderer.xr.getReferenceSpace())
  );

  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);

  controller2.addEventListener('squeezestart', onSqueezeStart);
  controller2.addEventListener('squeezeend', onSqueezeEnd);
}


function loadModels() {
  new RGBELoader()
    .setPath("/models/")
    .load("dikhololo_night_4k.hdr", function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
      scene.environment = texture;

      // Load World.gltf model
      const loader = new GLTFLoader().setPath("/models/");
      loader.load("World.gltf", function (gltf) {
        const model = gltf.scene;
        group.add(model); // Add the loaded model to the group

        // Add the model to the teleport group
        teleportgroup.add(model);
      });
    });
}

function setupControllers() {
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  scene.add(controller2);

  // Load your custom model
  const basePath = './models/'; 
  const loader = new GLTFLoader().setPath(basePath);
  loader.load('gundy/scene.gltf', async function (gltf) {
    gltf.scene.scale.set(0.0003, 0.0003, 0.0003);
    let mymodel = gltf.scene;
    mymodel.rotation.y = THREE.MathUtils.degToRad(180);
    mymodel.rotation.x = THREE.MathUtils.degToRad(-36.5);
    mymodel.position.set(0, 0.01, 0);
    controllerGrip2.add(mymodel); // Attach your custom model to controllerGrip2
  });

  // Rest of the controller setup remains the same
  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1); // Already initialized
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2)); // Use this line to add default model
  scene.add(controllerGrip2);

  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
  const line = new THREE.Line(geometry);
  line.name = 'line';
  line.scale.z = 5;

  controller1.add(line.clone());
  controller2.add(line.clone());

  raycaster = new THREE.Raycaster();
}

function initVR() {
  document.body.appendChild(VRButton.createButton(renderer));
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelectStart(event) {
  const controller = event.target;
  controller.userData.targetRayMode = event.data.targetRayMode;
}

function onSelectEnd(event) {
  const controller = event.target;
}

function getIntersections(controller) {
  controller.updateMatrixWorld();
  raycaster.setFromXRController(controller);
  return raycaster.intersectObjects(group.children, true);
}

function intersectObjects(controller) {
  if (controller.userData.targetRayMode === 'screen') return;
  const line = controller.getObjectByName('line');
  const intersections = getIntersections(controller);

  cleanIntersected();

  if (intersections.length > 0) {
    const intersection = intersections[0];
    const object = intersection.object;
    object.material.emissive.r = 1;
    intersected.push(object);
    line.scale.z = intersection.distance;
  } else {
    line.scale.z = 5;
  }
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    object.material.emissive.r = 0;
  }
}

function onSqueezeStart() {
  this.userData.isSqueezing = true;
  console.log('Controller squeeze started');
}

function onSqueezeEnd() {
  this.userData.isSqueezing = false;
  console.log('squeezeend');
  if (INTERSECTION) {
    const offsetPosition = {
      x: -INTERSECTION.x,
      y: -INTERSECTION.y,
      z: -INTERSECTION.z,
      w: 1,
    };
    const offsetRotation = new THREE.Quaternion();
    const transform = new XRRigidTransform(offsetPosition, offsetRotation);
    const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace(transform);
    renderer.xr.setReferenceSpace(teleportSpaceOffset);
  }
}

function moveMarker() {
  INTERSECTION = undefined;
  const squeezingController = controller1.userData.isSqueezing ? controller1 : controller2;
  if (squeezingController) {
    tempMatrix.identity().extractRotation(squeezingController.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(squeezingController.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const intersects = raycaster.intersectObjects(teleportgroup.children, true);
    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
      console.log(intersects[0]);
      console.log(INTERSECTION);
    }
  }
  if (INTERSECTION) marker.position.copy(INTERSECTION);
  marker.visible = INTERSECTION !== undefined;
}
