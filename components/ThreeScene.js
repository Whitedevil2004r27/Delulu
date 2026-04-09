'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeScene() {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const container = mountRef.current;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        // HEART SHAPE GEOMETRY
        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        heartShape.moveTo( x + 0.5, y + 0.5 );
        heartShape.bezierCurveTo( x + 0.5, y + 0.5, x + 0.4, y, x, y );
        heartShape.bezierCurveTo( x - 0.6, y, x - 0.6, y + 0.7,x - 0.6, y + 0.7 );
        heartShape.bezierCurveTo( x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9 );
        heartShape.bezierCurveTo( x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7 );
        heartShape.bezierCurveTo( x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y );
        heartShape.bezierCurveTo( x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5 );

        const geometry = new THREE.ShapeGeometry( heartShape );
        geometry.center();

        const heartColors = ['#ff4d6d', '#ff758f', '#ff8fa3', '#ffb3c1', '#ffccd5'];
        const hearts = [];
        const STAR_BASE_SPEED = 0.005;
        
        for (let i = 0; i < 120; i++) {
            const color = new THREE.Color(heartColors[Math.floor(Math.random() * heartColors.length)]);
            const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
            const heart = new THREE.Mesh(geometry, material);
            
            const scale = Math.random() * 0.1 + 0.08;
            heart.scale.set(scale, -scale, scale); 
            
            heart.position.set(
                (Math.random() - 0.5) * 16, 
                (Math.random() - 0.5) * 12, 
                (Math.random() - 0.5) * 6 - 1 
            );
            
            heart.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            heart.userData = {
                baseSpeed: Math.random() * 0.01 + STAR_BASE_SPEED,
                speed: Math.random() * 0.01 + STAR_BASE_SPEED,
                drift: Math.random() * 2,
                phase: Math.random() * Math.PI * 2,
                baseX: heart.position.x
            };
            
            scene.add(heart);
            hearts.push(heart);
        }

        // ROTATING 3D ROSE/HEART IN CENTER
        const roseGroup = new THREE.Group();
        const roseMaterial = new THREE.MeshPhongMaterial({ color: 0x590d22, shininess: 100, side: THREE.DoubleSide });
        
        const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: 0.15, bevelThickness: 0.15 };
        const centerHeartGeo = new THREE.ExtrudeGeometry( heartShape, extrudeSettings );
        centerHeartGeo.center();
        
        const centerHeart = new THREE.Mesh(centerHeartGeo, roseMaterial);
        centerHeart.scale.set(1, -1, 1);
        roseGroup.add(centerHeart);
        
        roseGroup.scale.set(0.6, 0.6, 0.6);
        scene.add(roseGroup);

        const pointLight = new THREE.PointLight(0xff4d6d, 1.5);
        pointLight.position.set(0, 2, 3);
        scene.add(pointLight);

        const ambientLight = new THREE.AmbientLight(0xfff0f3, 0.6);
        scene.add(ambientLight);

        // GOLDEN STAR PARTICLES & CONSTELLATION MATH
        const starsCount = 60;
        const starsGeo = new THREE.BufferGeometry();
        const posArray = new Float32Array(starsCount * 3);
        const targetPosArray = new Float32Array(starsCount * 3);
        
        for(let i = 0; i < starsCount; i++) {
            // Random Initial Position
            posArray[i * 3] = (Math.random() - 0.5) * 20;
            posArray[i * 3 + 1] = (Math.random() - 0.5) * 20;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

            // Target Heart Position for Constellation (Parametric Math)
            const t = (i / starsCount) * Math.PI * 2;
            const hx = 16 * Math.pow(Math.sin(t), 3);
            const hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            
            // Adjust scale and position
            targetPosArray[i * 3] = hx * 0.15;
            targetPosArray[i * 3 + 1] = hy * 0.15 + 1; // higher up physically
            targetPosArray[i * 3 + 2] = -1; // Bring relatively forward
        }
        
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({
            size: 0.05,
            color: 0xd4af37,
            transparent: true,
            opacity: 0.7
        });
        const starParticles = new THREE.Points(starsGeo, starsMat);
        scene.add(starParticles);

        // Constellation Connecting Lines
        const lineMat = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0 });
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const constellationLine = new THREE.LineLoop(lineGeo, lineMat); // LineLoop automatically connects back to start
        scene.add(constellationLine);


        // --- EXPLOSION PARTICLE SYSTEM ---
        const explosions = [];
        const createExplosion = (x, y, z) => {
            const particleCount = 20;
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(particleCount * 3);
            const velocities = [];
            for (let i = 0; i < particleCount; i++) {
               pos[i*3] = x;
               pos[i*3+1] = y;
               pos[i*3+2] = z;
               velocities.push({
                   x: (Math.random() - 0.5) * 0.3,
                   y: (Math.random() - 0.5) * 0.3,
                   z: (Math.random() - 0.5) * 0.3
               });
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color: 0xd4af37, size: 0.05, transparent: true, opacity: 1 });
            const points = new THREE.Points(geo, mat);
            scene.add(points);
            explosions.push({ points, velocities, life: 1.0 });
        };

        // --- RAYCASTER & INTERACTIVITY ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(-100, -100);
        let roseHovered = false;
        let roseClicks = 0;
        let easterEggActive = false;

        const chimeAudio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3?filename=magic-chime-02-104316.mp3');

        const onMouseMove = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        const onClick = () => {
             raycaster.setFromCamera(mouse, camera);

             // Check Catch a Heart Minigame
             const heartIntersects = raycaster.intersectObjects(hearts);
             if (heartIntersects.length > 0) {
                 const clickedHeart = heartIntersects[0].object;
                 if (clickedHeart.visible) {
                     clickedHeart.visible = false;
                     // Play magical chime (reset time to allow rapid clicking)
                     chimeAudio.currentTime = 0;
                     chimeAudio.play().catch(e => {});
                     
                     // Spawn explosion glitter
                     createExplosion(clickedHeart.position.x, clickedHeart.position.y, clickedHeart.position.z);
                     
                     // Respawn heart at the bottom gracefully
                     setTimeout(() => {
                         clickedHeart.position.y = -7;
                         clickedHeart.userData.baseX = (Math.random() - 0.5) * 16;
                         clickedHeart.visible = true;
                     }, 3000);
                 }
             }

             // Check Central Rose
             const roseIntersects = raycaster.intersectObjects(roseGroup.children);
             if (roseIntersects.length > 0) {
                 roseClicks++;
                 if (roseClicks >= 3 && !easterEggActive) {
                     easterEggActive = true;
                     playEasterEggAnim();
                 }
                 roseGroup.scale.set(1.1, 1.1, 1.1);
                 setTimeout(() => roseGroup.scale.set(0.6, 0.6, 0.6), 100);
             }
        };

        const onTouchStart = (event) => {
            if (event.touches.length > 0) {
                mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
                onClick();
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('click', onClick);
        window.addEventListener('touchstart', onTouchStart, { passive: false });

        // --- EVENTS ---
        let burstActive = false;
        let burstMultiplier = 1;
        const onBurstParticles = (e) => {
           const massive = e.detail?.massive;
           burstActive = true;
           burstMultiplier = massive ? 15 : 6;
           
           hearts.forEach(heart => {
               heart.material.color.setHex(massive ? 0xd4af37 : 0xffffff);
           });
           
           setTimeout(() => {
               burstActive = false;
               burstMultiplier = 1;
               hearts.forEach(heart => {
                    const color = new THREE.Color(heartColors[Math.floor(Math.random() * heartColors.length)]);
                    heart.material.color.set(color);
               });
           }, 2500);
        };
        window.addEventListener('burstParticles', onBurstParticles);

        // Constellation Trigger
        let constellationActive = false;
        const onDrawConstellation = () => {
            constellationActive = true;
        };
        window.addEventListener('drawConstellation', onDrawConstellation);

        // --- EASTER EGG TEXT ---
        let hiddenText;
        const playEasterEggAnim = () => {
            hiddenText = document.createElement('div');
            hiddenText.innerText = "You found the secret. Every beat is a thought of you.";
            hiddenText.style.position = 'fixed';
            hiddenText.style.top = '50%';
            hiddenText.style.left = '50%';
            hiddenText.style.transform = 'translate(-50%, -50%)';
            hiddenText.style.fontFamily = "'Playfair Display', serif";
            hiddenText.style.fontSize = '2.2rem';
            hiddenText.style.color = '#590d22';
            hiddenText.style.background = 'rgba(255, 240, 243, 0.9)';
            hiddenText.style.padding = '2rem 4rem';
            hiddenText.style.borderRadius = '8px';
            hiddenText.style.boxShadow = '0 10px 40px rgba(255, 77, 109, 0.3)';
            hiddenText.style.zIndex = '9999';
            hiddenText.style.opacity = '0';
            hiddenText.style.transition = 'opacity 1s ease';
            hiddenText.style.pointerEvents = 'none';
            document.body.appendChild(hiddenText);
            
            setTimeout(() => hiddenText.style.opacity = '1', 100);
            setTimeout(() => {
                if(hiddenText) {
                    hiddenText.style.opacity = '0';
                    setTimeout(() => hiddenText.remove(), 1000);
                }
                easterEggActive = false;
                roseClicks = 0;
            }, 6000);
        };

        const clock = new THREE.Clock();
        let animationFrameId;

        // ANIMATION LOOP
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(roseGroup.children);
            roseHovered = intersects.length > 0;

            // Animate Floating Hearts
            hearts.forEach(heart => {
                if (!heart.visible) return; // Skip if exploded
                let currentSpeed = heart.userData.baseSpeed;
                if (burstActive) currentSpeed *= burstMultiplier;
                
                heart.position.y += currentSpeed;
                heart.rotation.y += burstActive ? 0.05 : 0.01;
                heart.rotation.z += burstActive ? 0.1 : 0.02;
                heart.position.x = heart.userData.baseX + Math.sin(elapsedTime * 0.5 + heart.userData.phase) * heart.userData.drift;
                
                if (heart.position.y > 7) {
                    heart.position.y = -7;
                    heart.userData.baseX = (Math.random() - 0.5) * 16;
                }
            });

            // Animate Heart Explosions
            for (let i = explosions.length - 1; i >= 0; i--) {
                const exp = explosions[i];
                exp.life -= 0.02; 
                if (exp.life <= 0) {
                    scene.remove(exp.points);
                    exp.points.geometry.dispose();
                    exp.points.material.dispose();
                    explosions.splice(i, 1);
                    continue;
                }
                const positions = exp.points.geometry.attributes.position.array;
                for (let j = 0; j < 20; j++) {
                    positions[j*3] += exp.velocities[j].x;
                    positions[j*3+1] += exp.velocities[j].y;
                    positions[j*3+2] += exp.velocities[j].z;
                }
                exp.points.geometry.attributes.position.needsUpdate = true;
                exp.points.material.opacity = exp.life;
            }

            // Animate Central Body
            if (roseHovered || easterEggActive) {
               roseGroup.rotation.y += 0.05;
               roseGroup.rotation.x += 0.02;
               roseMaterial.emissive.setHex(0x330011);
            } else {
               roseGroup.rotation.y += 0.005;
               roseGroup.rotation.x += 0.002;
               roseMaterial.emissive.setHex(0x000000);
            }

            // Animate Constellation Stars
            const positions = starsGeo.attributes.position.array;
            if (constellationActive) {
                for(let i = 0; i < starsCount * 3; i++) {
                    positions[i] += (targetPosArray[i] - positions[i]) * 0.02;
                }
                starsGeo.attributes.position.needsUpdate = true;
                lineGeo.attributes.position.needsUpdate = true;
                
                // Fade in connecting lines
                if (lineMat.opacity < 0.6) lineMat.opacity += 0.005;
                starsMat.opacity = 0.9;
            } else {
                // Subtle pulse before constellation forms
                starsMat.opacity = 0.5 + Math.sin(elapsedTime * 2) * 0.3;
            }

            renderer.render(scene, camera);
        }

        animate();

        // RESIZE HANDLING
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // CLEANUP
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('click', onClick);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('burstParticles', onBurstParticles);
            window.removeEventListener('drawConstellation', onDrawConstellation);
            cancelAnimationFrame(animationFrameId);
            if (hiddenText && document.body.contains(hiddenText)) {
                hiddenText.remove();
            }
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            geometry.dispose();
            roseMaterial.dispose();
            roseGroup.children.forEach(c => {
                if(c.geometry) c.geometry.dispose();
            });
            starsGeo.dispose();
            starsMat.dispose();
            lineMat.dispose();
            lineGeo.dispose();
            renderer.dispose();
        };
    }, []);

    return <div id="canvas-container" ref={mountRef} style={{ pointerEvents: 'auto', cursor: 'pointer' }}></div>;
}
