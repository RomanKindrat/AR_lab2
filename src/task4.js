import './style.css'
import * as THREE from "three"
import { ARButton } from "three/addons/webxr/ARButton.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container;
let camera, scene, renderer;
let reticle;
let controller;
let model = null;

init();
animate();

function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Сцена
    scene = new THREE.Scene();

    // Камера
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Світло (можна додати кілька джерел)
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    hemisphereLight.position.set(0.5, 1, 0.25);
    scene.add(hemisphereLight);

    // Контролер для створення об’єкту
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    // Мітка поверхні (ретікл)
    addReticleToScene();

    // Кнопка для AR + Hit Test
    const button = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"]
    });
    document.body.appendChild(button);

    // Поки AR не активний, приховуємо холст
    renderer.domElement.style.display = "none";

    window.addEventListener("resize", onWindowResize, false);
}

function addReticleToScene() {
    // Ринг у площині XZ
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    const material = new THREE.MeshBasicMaterial();

    reticle = new THREE.Mesh(geometry, material);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Для наочності можна додати AxesHelper, але це опціонально
    // reticle.add(new THREE.AxesHelper(1));
}

function onSelect() {
    if (reticle.visible) {
        // Тут завантажуємо модель GLTF
        // Заміни на свій URL, де ти хостиш модель "планети та космос"
        const modelUrl = 'https://romankindrat.github.io/models-host/planet.gltf';

        // Використовуємо GLTFLoader
        const loader = new GLTFLoader();

        // Якщо модель уже була на сцені — приберемо (для демонстрації)
        if (model) {
            scene.remove(model);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
            model = null;
        }

        loader.load(
            modelUrl,
            function (gltf) {
                model = gltf.scene;

                // Ставимо в те саме місце, де ретікл
                model.position.set(reticle.position.x, reticle.position.y, reticle.position.z);
                model.rotation.copy(reticle.rotation);

                // Підлаштуйте масштаб під розміри вашої моделі
                model.scale.set(0.02, 0.02, 0.02);

                // Додамо на сцену
                scene.add(model);

                // Додаткове світло (Directional), якщо потрібно яскравіше
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
                directionalLight.position.set(3, 3, 3);
                scene.add(directionalLight);

                console.log("Model added to scene at", model.position);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('Error loading model:', error);
            }
        );
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

// ---- Hit Testing ----
let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

async function initializeHitTestSource() {
    const session = renderer.xr.getSession();
    const viewerSpace = await session.requestReferenceSpace("viewer");
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

    localSpace = await session.requestReferenceSpace("local");
    hitTestSourceInitialized = true;

    // Коли AR-сеанс завершиться
    session.addEventListener("end", () => {
        hitTestSourceInitialized = false;
        hitTestSource = null;
    });
}

function render(timestamp, frame) {
    if (frame) {
        if (!hitTestSourceInitialized) {
            initializeHitTestSource();
        }

        if (hitTestSourceInitialized) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(localSpace);

                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }

        renderer.render(scene, camera);
    }
}