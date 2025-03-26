import './style.css';

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, renderer;
let model;
let loader;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    // Камера
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        40
    );
    camera.position.set(0, 1.6, 3); // для перегляду з відстані

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Світло
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(3, 3, 3);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Завантаження GLTF-моделі
    const modelUrl = 'https://romankindrat.github.io/models-host/scene.gltf';

    loader = new GLTFLoader();
    loader.load(
        modelUrl,
        function (gltf) {
          model = gltf.scene;
      
          // Позиціонування
          model.scale.set(0.05, 0.05, 0.05);
          model.position.set(0, 1, -1);
          model.rotation.y = Math.PI / 6;
      
          scene.add(model);
        },
        undefined,
        function (error) {
          console.error('Помилка завантаження моделі:', error);
        }
      );

    // AR-кнопка
    document.body.appendChild(ARButton.createButton(renderer));

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    rotateModel();
    renderer.render(scene, camera);
}

// Базова анімація – обертання
let degrees = 0;
function rotateModel() {
    if (model) {
        degrees += 0.2;
        model.rotation.y = THREE.MathUtils.degToRad(degrees);
    }
}