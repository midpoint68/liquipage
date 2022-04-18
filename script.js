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
      const particle = new Particle({x: 0, y: 0, radius: 1, data: span});
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
    const bb = particle.data.getBoundingClientRect();
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
document.addEventListener("mousemove", (e) => {
  if(!moving) {
    moving = true;
    requestAnimationFrame(()=>{

      // Search for affected chars
      affectedChars = pocket.search(searchRadius, {x: e.pageX, y: e.pageY});
      for(const char of affectedChars) {
        movedChars.add(char);
        const diffX = char.x - e.pageX;
        const diffY = char.y - e.pageY;
        const dist = Math.sqrt(diffX*diffX + diffY*diffY);
        if(dist > 0) {
          const pushFactor = Math.pow(searchRadius - (dist - char.radius), 0.9);
          char.data.style.left = `${pushFactor*diffX/dist}px`;
          char.data.style.top = `${pushFactor*diffY/dist}px`;
        }
      }

      // Reset non-affected chars
      for(const char of movedChars) {
        if(!affectedChars.has(char)) {
          char.data.style.left = "0";
          char.data.style.top  = "0";
        }
      }

      // Done moving
      moving = false;
      // if(!drawing) draw();
    });
  }
});

let drawing = false;
const draw = () => {
  drawing = true;

  // Move chars towards origin
  const charsToMove = [...movedChars];
  for(const char of charsToMove) {
    if(!affectedChars.has(char)) {
      const x = parseFloat(char.data.style.left);
      const y = parseFloat(char.data.style.top);
      if(Math.sqrt(x*x + y*y) < 1) {
        char.data.style.left = '0';
        char.data.style.top  = '0';
        movedChars.delete(char);
      } else {
        char.data.style.left = `${x*0.8}px`;
        char.data.style.top  = `${y*0.8}px`;
      }
    }
  }

  if(movedChars.size > 0) {
    requestAnimationFrame(draw);
  } else {
    drawing = false;
  }
}