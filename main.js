import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let container, camera, scene, renderer, cone, axesHelper, controls;

init();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 2, 2);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    scene.add(directionalLight);

    const geometry = new THREE.ConeGeometry(1, 2, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    cone = new THREE.Mesh(geometry, material);

    // Apply transformations to the cone
    cone.position.x = 0;
    cone.scale.set(1, 1, 1);
    cone.rotation.y = Math.PI / 4;

    scene.add(cone);

    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    window.addEventListener('resize', resize, false);
    resize();

    animate();
}

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
