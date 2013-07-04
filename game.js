/*
*  A really archaic game to study some JavaScript
*	
*	Author: Robson Kraemer
*   Improvements: Rafael Weber Scheidmandel
*/
;(function(window, document) {
	
	// Game
	function Game() {
		this.gameSpeedLimit = 8; //
		this.gameSpeed  = 2.5; //

		this.canvas = document.createElement('canvas')
		
		this.world = {
			width: window.innerWidth - 100, 
			height: window.innerHeight - 100
		};
		
		this.particles = [];
				
		this.statusEl = document.createElement('p');
		this.timeLastParticleAdded = new Date().getTime();
		this.intervalBetweenNewParticles = 2000;
	}
	Game.prototype = {
		init : function() {
			var self = this;
			this.canvas.width = this.world.width;
			this.canvas.height = this.world.height;
			
			document.body.appendChild(this.canvas);
			
			this.context = this.canvas.getContext('2d');
			this.player = new Player(this.world);
						
			document.body.appendChild(this.statusEl);

			// Register event
			document.addEventListener('mousemove', function(ev) {
				self.player.moveListener(ev); // can't loose scope/context
			}, false);
			
			// one fn to rule them all
			this.refresh();	
		},
		
		refresh : function() {
			var self = this;
			this.showStatus();
			this.clearContext();
			this.player.draw(this.context);
			
			this.addNewParticleToTheWorld();
			this.updateExistingParticlesPosition();
			this.treatCollisions();
			
			if (this.player.looseGame()) {
				this.showStatus();
				if (confirm('Você perdeu o jogo =(.\nDeseja continuar jogando?')) { 
					location.reload();
				}
			} else {
				requestAnimFrame(function() {
					self.refresh();
				});
			}
		},
		
		addNewParticleToTheWorld : function() {
			if ((new Date().getTime() - this.timeLastParticleAdded) < this.intervalBetweenNewParticles) return;

			var y = 0,
				x = this.world.width * Math.random(),
				isGood = (Math.floor(Math.random() * 5) % 2 == 0) ? true : false;
			
			var particle = new Particle(x, y, isGood);
			
			particle.draw(this.context);
			
			this.particles.push(particle);
			this.timeLastParticleAdded = new Date().getTime();
		},
		
		updateExistingParticlesPosition : function() {	
			for (var i = 0; i < this.particles.length; i++) {
				var particle = this.particles[i];
				particle.fallALittleBit(this.gameSpeed);
				particle.draw(this.context);
			}
		},
		
		// collision treatment
		passedPlayerAxis : function(particle) {
			return (particle.y > this.player.y);
		},
		// utils - related to elements
		intersects : function(circle, rect) {
			var circleDistance = {x: 0, y: 0};
			circleDistance.x = Math.abs(circle.x - rect.x);
			circleDistance.y = Math.abs(circle.y - rect.y);

			if (circleDistance.x > (rect.dimensions.width/2 + Math.PI)) { return false; }
			if (circleDistance.y > (rect.dimensions.height/2 + Math.PI)) { return false; }

			if (circleDistance.x <= (rect.dimensions.width/2)) { return true; } 
			if (circleDistance.y <= (rect.dimensions.height/2)) { return true; }

			cornerDistance_sq = (circleDistance.x - rect.dimensions.width/2) * (circleDistance.x - rect.dimensions.width/2) +
								(circleDistance.y - rect.dimensions.height/2) * (circleDistance.y - rect.dimensions.height/2);

			return (cornerDistance_sq <= (Math.PI * Math.PI));
		},
		
		treatCollisions : function() {
			for (var i = 0; i < this.particles.length; i++) {
				var particle = this.particles[i];
				if (this.intersects(particle, this.player)) {
					if (particle.isGood) {
						if (this.gameSpeed < this.gameSpeedLimit) {
							this.gameSpeed += 0.1;
						}
						// store the earned particle and show
						this.intervalBetweenNewParticles = this.getRandomInterval();
					} else {
						this.player.dimensions.width -= 20; // loose width proportional to the max particles missed
					}
					this.particles.splice(this.particles.indexOf(particle), 1);
				} else { 
					if (particle.isGood && this.passedPlayerAxis(particle)) {
						this.player.missedParticles++;
						this.particles.splice(this.particles.indexOf(particle), 1);
					}
				}
			}
			return false;
		},
		
		// others
		getRandomInterval : function() {
			var intervals = [2000, 1500, 1000, 500],
				index = Math.floor(Math.random() * 4);
				
			return intervals[index] - (this.gameSpeed * 10);
		},
		
		showStatus : function() {
			this.statusEl.innerHTML = 'Você já perdeu ' + this.player.missedParticles + ' bolinhas';
		},
		
		clearContext : function() {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	};

	// Particle
	function Particle(x, y, isGood) {
		this.x = x;
		this.y = y;
		this.isGood = isGood;
		this.color = (isGood) ? 'green' : 'red';
	}
	Particle.prototype = {
		fallALittleBit : function(gameSpeed) {
			this.y += gameSpeed;
		},
		draw : function(context) {
			context.beginPath();
			context.arc(this.x, this.y, 25, 0, 2 * Math.PI, false);
			context.fillStyle = this.color;
			context.fill();
			context.lineWidth = 2;
			context.strokeStyle = '#003300';
			context.stroke();
		}
	};

	// Player
	function Player(world) {
		this.x = world.width / 2;
		this.y = world.height - 20;
		this.dimensions = {
			width: 120, 
			height: 15
		};
		this.missedParticles = 0;
		this.missedParticlesLimit = 3;
	}
	Player.prototype = {
		draw : function(context) {
			context.beginPath();
			context.rect(this.x, this.y, this.dimensions.width, this.dimensions.height);
			context.fillStyle = 'yellow';
			context.fill();
			context.lineWidth = 2;
			context.strokeStyle = 'black';
			context.stroke();
		},
		moveListener : function(ev) {
			this.x = ev.x;
		},
		looseGame : function() {
			return (this.dimensions.width < 20) || (this.missedParticles == this.missedParticlesLimit);
		}
	};

	// shim with setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	window.requestAnimFrame = (function(){
	  return  window.requestAnimationFrame       || 
			  window.webkitRequestAnimationFrame || 
			  window.mozRequestAnimationFrame    || 
			  window.oRequestAnimationFrame      || 
			  window.msRequestAnimationFrame     || 
			  function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			  };
	})();
	
	window.Game = Game;
	
})(window, document);
