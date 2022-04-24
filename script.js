// Import pocket.js
import { Pocket, Particle } from "https://cdn.jsdelivr.net/gh/midpoint68/pocket@main/pocket.js";

// Print Characters
const pocket = new Pocket();
const particles = [];
const movedChars = new Set();

window.addEventListener("load", ()=>{

  // Convert characters
  document.querySelectorAll(".print").forEach(elem=>{
    const content = elem.textContent;
    const characters = content.split('').map(char=>{
      const span = document.createElement("span");
      span.innerHTML = char + "";
      if(char !== ' ') {
        span.classList.add("print-char");
      }

      // Add particle
      const particle = new Particle({x: 0, y: 0, radius: 1, data: { elem: span, vel: { x: 0, y: 0 } }});
      particles.push(particle);
      pocket.put(particle);

      // Return element
      return span;
    });
    elem.innerHTML = "";
    elem.append(...characters);
  });

  // Update
  onResize();

});

let searchRadius = 100;
const onResize = () => {
  for(const particle of particles) {
    const bb = particle.data.elem.getBoundingClientRect();
    const x = bb.left + window.scrollX;
    const y = bb.top + window.scrollY;
    const radius = Math.sqrt((bb.width * bb.width) + (bb.height * bb.height)) / 2;
    particle.setRadius(radius);
    particle.moveTo({x: x + bb.width/2, y: y + bb.height/2});
  }
};
window.addEventListener("resize", onResize);

let moving = false;
let affectedChars = new Set();
let lastPos;
let lastMouseMove;
document.addEventListener("mousemove", (e) => {
  if(!moving) {
    moving = true;
    requestAnimationFrame(()=>{

      // Get mouse velocity
      const now = performance.now();
      if(!lastPos) {
        lastPos = { x: e.pageX, y: e.pageY };
        lastMouseMove = now;
      }
      const deltaT = now - lastMouseMove;
      lastMouseMove = now;

      // Only move if time has elapsed
      if(deltaT) {
        const mouseVel = { x: (e.pageX - lastPos.x) / deltaT, y: (e.pageY - lastPos.y) / deltaT };
        lastPos = { x: e.pageX, y: e.pageY };

        // Search for affected chars
        affectedChars = pocket.search(searchRadius, {x: e.pageX, y: e.pageY});
        for(const char of affectedChars) {
          movedChars.add(char);
          const diffX = char.x - e.pageX;
          const diffY = char.y - e.pageY;
          const dist = Math.sqrt(diffX*diffX + diffY*diffY);
          if(dist > 0) {
            const pushFactor = 0.01*Math.pow(searchRadius - (dist - char.radius), 0.9);
            char.data.vel.x += pushFactor * mouseVel.x;
            char.data.vel.y += pushFactor * mouseVel.y;
          }
        }

        // Draw movements
        startDrawing();

      }

      // Done moving
      moving = false;
    });
  }
});

let drawing = false;
let lastDraw = 0;
const startDrawing = () => {
  if(!drawing) {
    lastDraw = performance.now();
    draw();
  }
}
const draw = () => {
  drawing = true;

  // Get time elapsed
  const now = performance.now();
  const deltaT = now - lastDraw
  lastDraw = now;

  if(deltaT > 0) {

    // Move chars according to vel and origin
    const charsToMove = [...movedChars];
    for(const char of charsToMove) {
      char.data.vel.x *= 0.9;
      char.data.vel.y *= 0.9;
      const x = (parseFloat(char.data.elem.style.left) || 0) + char.data.vel.x * deltaT;
      const y = (parseFloat(char.data.elem.style.top) || 0) + char.data.vel.y * deltaT;
      if(Math.sqrt(x*x + y*y) < 1) {
        char.data.elem.style.left = '0';
        char.data.elem.style.top  = '0';
        char.data.vel = { x: 0, y: 0 };
        movedChars.delete(char);
      } else {
        char.data.elem.style.left = `${x*0.8}px`;
        char.data.elem.style.top  = `${y*0.8}px`;
      }
    }

  }

  if(movedChars.size > 0) {
    requestAnimationFrame(draw);
  } else {
    drawing = false;
  }
}