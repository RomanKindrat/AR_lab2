import './style.css'

import * as THREE from 'three'
import { ARButton } from 'three/addons/webxr/ARButton.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let camera, scene, renderer;
let sphereMesh, cylinderMesh, planeMesh;
let controls;

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Створюємо сцену
    scene = new THREE.Scene();

    // Камера
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        40
    );
    camera.position.z = 3; 

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Додаємо світло
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(3, 3, 3);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 5, 10); 
    pointLight.position.set(-2, 2, 2);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // 1. Сфера (SphereGeometry)
    const sphereGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x0080ff,
        metalness: 0.3,
        roughness: 0.5,
    });
    sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.x = -1.5;
    scene.add(sphereMesh);

    // 2. Циліндр (CylinderGeometry)
    const cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 32);
    const cylinderMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff4444,
        roughness: 0.2,
        metalness: 0.7,
        reflectivity: 0.9
    });
    cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinderMesh.position.x = 0;
    scene.add(cylinderMesh);

    // 3. Площина (PlaneGeometry) з двобічним відображенням
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0,
  roughness: 1,
  side: THREE.DoubleSide, // важливо!
});

// Створюємо меш
planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

// Ставимо праворуч та трохи ближче, щоб не перекривався циліндром
planeMesh.position.set(1.5, 0, -0.5);

// Повертаємо площину так, щоб вона була «видимою» під кутом
planeMesh.rotation.y = -Math.PI / 4;
// Або, як варіант:
// planeMesh.rotation.x = -Math.PI / 4;

scene.add(planeMesh);

    // Додаємо стандартну кнопку для AR
    document.body.appendChild(ARButton.createButton(renderer));

    // Контролери (OrbitControls) для огляду в не-AR режимі
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Слухач подій для масштабування сцени при зміні розмірів вікна
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    // Автоматично керує рендером під час AR-сеансу
    renderer.setAnimationLoop(render);
    controls.update();
}

function render() {
    rotateObjects();
    renderer.render(scene, camera);
}

// Проста анімація обертання кожного об'єкта
function rotateObjects() {
    sphereMesh.rotation.y += 0.01;
    sphereMesh.rotation.x += 0.01
    cylinderMesh.rotation.x += 0.01;
    planeMesh.rotation.z += 0.01;
}