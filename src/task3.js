import './style.css'
import * as THREE from "three"
import { ARButton } from "three/addons/webxr/ARButton.js"

let container;
let camera, scene, renderer;
let reticle;
let controller;

init();
animate();

function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Сцена
    scene = new THREE.Scene();

    // Камера
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
    );

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Світло
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Контролер для додавання об'єкта
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    // Створюємо ретікл (мітку поверхні)
    addReticleToScene();

    // Кнопка для AR з Hit Test
    const button = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"]
    });
    document.body.appendChild(button);

    // Ховаємо рендерер, поки не почнеться AR-сеанс
    //renderer.domElement.style.display = "none";

    window.addEventListener("resize", onWindowResize, false);
}

function addReticleToScene() {
    // Ринг, що лежить у площині XZ (RotateX(-Math.PI/2))
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial();

    reticle = new THREE.Mesh(geometry, material);

    // Вимикаємо автооновлення матриці — контролюватимемо вручну
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Щоб краще орієнтуватися у сцені
    reticle.add(new THREE.AxesHelper(1));
}

function onSelect() {
    // Якщо ретікл видно, значить, хіт-тест знайшов поверхню
    if (reticle.visible) {
        // Створюємо СФЕРУ (за вашим варіантом)
        const geometry = new THREE.SphereGeometry(0.05, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff * Math.random(),
            metalness: 0.3,
            roughness: 0.5
        });

        const sphere = new THREE.Mesh(geometry, material);

        // Встановлюємо позицію та орієнтацію сфери так, як у reticle
        sphere.position.setFromMatrixPosition(reticle.matrix);
        sphere.quaternion.setFromRotationMatrix(reticle.matrix);

        // Додаємо на сцену
        scene.add(sphere);
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

// ---- Hit Test змінні ----
let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

// Ініціалізація Hit Test джерела
async function initializeHitTestSource() {
    const session = renderer.xr.getSession(); // XRSession
    
    // viewer-space (прив’язка до позиції камери/пристрою)
    const viewerSpace = await session.requestReferenceSpace("viewer");
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

    // local reference space (стабільність відносно кімнати)
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
        // 1. Якщо ще не ініціалізували джерело хіт-тестів — зробити це
        if (!hitTestSourceInitialized) {
            initializeHitTestSource();
        }

        // 2. Якщо вже ініціалізоване — перевірити результати
        if (hitTestSourceInitialized) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(localSpace);

                // Робимо ретікл видимим
                reticle.visible = true;

                // Оновлюємо матрицю ретікла
                reticle.matrix.fromArray(pose.transform.matrix);
            } else {
                reticle.visible = false;
            }
        }

        renderer.render(scene, camera);
    }
}