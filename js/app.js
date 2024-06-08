import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { boardMap } from './boardMap.js';

class ThreeManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.modelInstances = [];
    this.tablero = null;

    this.init();
  }

  init() {
    this.camera.position.set(0, 8, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;

    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('/models/hdri.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
    });

    this.container.appendChild(this.renderer.domElement);
    this.addLights();
    this.loadTablero();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.controls.enableDamping = true;
  }

  addLights() {
    const lightConfigs = [
      { position: [0, 100, 100], color: 0xffffff, intensity: 3 },
      { position: [0, 100, -100], color: 0xffffff, intensity: 3 },
      { position: [100, 100, 0], color: 0xffffff, intensity: 3 },
      { position: [-100, 100, 0], color: 0xffffff, intensity: 3 }
    ];

    lightConfigs.forEach((config) => {
      const light = new THREE.DirectionalLight(config.color, config.intensity);
      light.position.set(...config.position);
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 4000;
      light.shadow.mapSize.height = 4000;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 500.0;
      this.scene.add(light);
    });

    const ambientLight = new THREE.AmbientLight(0xCE3333, 1.0);
    this.scene.add(ambientLight);
  }

  loadTablero() {
    const loader = new GLTFLoader();
    loader.load('/models/tablero.gltf', (gltf) => {
      this.tablero = gltf.scene;
      this.tablero.scale.setScalar(0.8);
      this.tablero.position.y = -0.073;
      this.configureMaterials(this.tablero);
      this.scene.add(this.tablero);
    });
  }

  loadFicha(callback, color) {
    const loader = new GLTFLoader();
    loader.load('/models/ficha.gltf', (gltf) => {
      const model = gltf.scene;
      let nuevaInstancia = model.clone();
      nuevaInstancia.scale.setScalar(0.10);
      nuevaInstancia.traverse(c => {
        c.castShadow = true;
        if (c.isMesh) {
          c.material = c.material.clone();
          
          if(c.material.name === 'color') {
            c.material.color.set(color);
          }
        }
      });
      this.scene.add(nuevaInstancia);
      this.modelInstances.push(nuevaInstancia);
      callback(nuevaInstancia);
    });
  }

  configureMaterials(tablero) {
    tablero.traverse((node) => {
      if (node.isMesh) {
        node.material.envMap = this.scene.environment;
        node.material.envMapIntensity = 1;
        node.material.roughness = 0;
        node.material.metalness = 0.75;
        node.material.needsUpdate = true;
        node.receiveShadow = true;

        switch (node.material.name) {
          case 'base':
            node.material.color.set(0x000000);
            break;
          case 'group_1':
            node.material.color.set(0x00496D);
            break;
          case 'group_2':
            node.material.color.set(0x00964D);
            break;
          case 'group_3':
            node.material.color.set(0x928F92);
            break;
          case 'group_4':
            node.material.color.set(0xffffff);
            break;
          case 'group_5':
            node.material.color.set(0x2EC0EB);
            break;
          case 'group_6':
            node.material.color.set(0xFF1B00);
            break;
          case 'group_7':
            node.material.color.set(0xFEEC26);
            break;
          case 'triangulos':
            node.material.color.set(0x0D9FCA);
            break;
          case 'center_circle':
            node.material.color.set(0x00496D);
            break;
        }
      }
    });
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  moveModelToPosition(model, newPosition, duration = 0.3) {
    const startPosition = model.ficha.position.clone();
    const deltaPosition = new THREE.Vector3().subVectors(newPosition, startPosition);
    const peakHeight = 0.1;
  
    let start = null;
  
    const animateMove = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = (timestamp - start) / 1000;
      const t = Math.min(elapsed / duration, 1);
  
      // Interpolación horizontal
      const currentPosition = startPosition.clone().lerp(newPosition, t);
  
      // Interpolación vertical para elevar el modelo
      const heightOffset = Math.sin(t * Math.PI) * peakHeight;
      currentPosition.y += heightOffset;
  
      model.ficha.position.copy(currentPosition);
  
      if (t < 1) {
        requestAnimationFrame(animateMove);
      } else {
        model.ficha.position.copy(newPosition);
      }
    };
  
    requestAnimationFrame(animateMove);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

const gamePlayers = [
  {
    id: 1,
    name: 'Juan',
    ficha: null,
    lastPosition: null,
    helmets: [],
    questions: []
  },
  {
    id: 2,
    name: 'Jose Luis',
    ficha: null,
    lastPosition: null,
    helmets: [],
    questions: []
  },
  {
    id: 3,
    name: 'Eduard',
    ficha: null,
    lastPosition: null,
    helmets: [],
    questions: []
  },
  {
    id: 4,
    name: 'Bernabe',
    ficha: null,
    lastPosition: null,
    helmets: [],
    questions: []
  },
]

class Game {
  constructor(container) {
    this.container = container;
    this.threeManager = new ThreeManager(container);
    this.playerInitGame = [];
    this.players = [];
    this.alreadyPlayed = [];
    this.playersWithoutTurn = [];
    this.turn = null;
    this.init();
  }

  init() {
    this.animate();
    this.createPlayers(gamePlayers.length);
  }

  createPlayers(count) {

    const initialPositions = [
      new THREE.Vector3(-0.25, 0.10, -0.25),
      new THREE.Vector3(0.25, 0.10, -0.25),
      new THREE.Vector3(-0.25, 0.10, 0.25),
      new THREE.Vector3(0.25, 0.10, 0.25),
    ];

    const colors = [0xCE0000, 0x04C900, 0xE0D700, 0x003FE0];

    for (let i = 0; i < count; i++) {
      this.threeManager.loadFicha((ficha) => {
        ficha.position.copy(initialPositions[i]);

        let userPlayer = gamePlayers[i];
        userPlayer.helmets = new Set();
        userPlayer.ficha = ficha;

        this.players.push(userPlayer);
        if (this.players.length === count) {
          // this.movePlayersSequentially();

          // random init player
          this.randomInitPlayer(this.players);
        }
      }, colors[i]);
    }
  }

  randomInitPlayer(players) {
    const playerSelected = Math.floor(Math.random() * players.length);
    this.turn = playerSelected;
    const dados = Math.floor(Math.random() * 11) + 2;

    if(players.length > 0) {
      this.alreadyPlayed.push(playerSelected);
      this.movePlayersSequentially(players[playerSelected], dados, 'right');
    }
  }

  finishSteps(playerIndex, step) {

    console.log(step)

    let positionIndex = 0;
    const stepsInterval = setInterval(() => {

      // remuve el interval al recorrer todas las posiciones
      if (positionIndex >= step.finish.length) {
        clearInterval(stepsInterval);
        return;
      }

      const positions = step.finish[positionIndex].positions;
      const isFinish = step.finish[positionIndex].isFinish

      const pos = positions[playerIndex];
      const newPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      this.threeManager.moveModelToPosition(this.players[playerIndex], newPos);

      if(isFinish) {
        console.log(`${this.players[playerIndex].name} win`)
        // return
      }

      positionIndex++;

    }, 500);
  }

  nextPosition(arrLength, direction, lastIndex) {
    let newIndex;

    let lastPosition = boardMap.findIndex(el => el.name === lastIndex);

    // console.log({ ultima: boardMap[41] })
  
    if (direction === 'left') {
      newIndex = (lastPosition - 1 + arrLength) % arrLength;
    }
    
    if (direction === 'right') {
      newIndex = (lastPosition + 1) % arrLength;
    }
  
    return newIndex;
  }

  nextTurn(playerSelected) {
    this.turn = playerSelected;
    const dados = Math.floor(Math.random() * 11) + 2;

    if (!this.alreadyPlayed.includes(playerSelected)) {
      this.alreadyPlayed.push(playerSelected);
    }

    this.movePlayersSequentially(this.players[playerSelected], dados, 'right');
  }

  getNextPlayer(currentPlayer, validPlayers) {
    
    // if(this.playersWithoutTurn.includes(currentPlayer + 1)) {
    //   const cleanPlayer = this.playersWithoutTurn.filter(player => player !== currentPlayer + 1);
    //   this.playersWithoutTurn = cleanPlayer;
    // }

    const nextplayers = validPlayers.filter(index => index > currentPlayer);

    // Si hay un índice mayor, devuelve el primero de ellos
    if (nextplayers.length > 0) {
      return nextplayers[0];
    } else {
      // Si no hay índices mayores, vuelve al primer índice válido
      return validPlayers[0];
    }
  }

  canPlay() {
    const allPlayers =  this.players;
    const playersIndex = Object.keys(allPlayers);
    return playersIndex.map(i => Number(i));
  }

  movePlayersSequentially(player, step, direction) {

    let playerInit = this.players.findIndex(p => p.name === player.name)
    let positionIndex = 0;
    let nextPosition = null;
    const HELMET_REQUIRED = 6;

    const interval = setInterval(() => {
      if (positionIndex >= step) {
        const finishPosition = boardMap.filter(el => el.name === player.lastPosition)[0];
        // console.log(finishPosition)

        if(finishPosition?.action) {
          // console.log({
          //   player: player.name,
          //   action: finishPosition.action
          // })

          if(finishPosition.action === 'tirar_dados') {
            this.nextTurn(this.turn);
          }

          if(finishPosition.action === 'pierdes_turno') {

            if(!this.playersWithoutTurn.includes(playerInit)) {
              this.playersWithoutTurn.push(playerInit);
            }
            const nextPlayer = this.getNextPlayer(this.turn, this.canPlay());

            this.nextTurn(nextPlayer)
          }

          if(finishPosition.action === 'desafio') {
            if(this.alreadyPlayed.length >= this.players.length) {
              const reNewPlayer = this.alreadyPlayed.shift();
              // console.log(reNewPlayer)
            }

            
            console.log("Buscando retador...")
            const playersKeys = [...this.players.keys()]
            const filterList = playersKeys.filter(player => player !== playerInit)
            const retador = Math.floor(Math.random() * filterList.length);
            const challengePlayers = [playerInit, filterList[retador]];

            console.log(`${this.players[playerInit].name} vs ${this.players[filterList[retador]].name}`)
            
            const playerWin = Math.floor(Math.random() * 2);
            
            this.turn = challengePlayers[playerWin];
            console.log(`Gana ${this.players[challengePlayers[playerWin]].name}`)
            this.nextTurn(challengePlayers[playerWin]);
          }

          clearInterval(interval);
          return
        }

        if(finishPosition?.helmet) {
          // console.log({
          //   player: player.name,
          //   helmet: finishPosition.helmet
          // })

          if (!this.players[playerInit].helmets.has(finishPosition.helmet.id)) {
            this.players[playerInit].helmets.add(finishPosition.helmet.id);

            console.log(this.players)
          }

          if(this.players.filter(player => player.helmets.size === HELMET_REQUIRED)[0]) {
            clearInterval(interval);

            // llamar metodo finishSteps
            this.finishSteps(playerInit, boardMap[nextPosition - 1])
            return;
          }
        }

        if(finishPosition?.color && finishPosition?.color !== 'white') {
          // console.log({
          //   player: player.name,
          //   color: finishPosition.color
          // })
        }  

        ///////////////////
        // Siguiente turno

        if(this.alreadyPlayed.length >= this.players.length) {
          const reNewPlayer = this.alreadyPlayed.shift();
          // console.log(reNewPlayer)
        }
        
        const allPlayers = Array.from(this.players.keys());
        const validPlayers = allPlayers.filter(index => !this.alreadyPlayed.includes(index));

        const nextPlayer = this.getNextPlayer(this.turn, this.canPlay());

        this.nextTurn(nextPlayer)

        clearInterval(interval);
        return;
      }

      // sacar la posicion
      if(!this.players[playerInit]?.lastPosition) {
        this.players[playerInit].lastPosition = 'box_1';
      }

      const elementPosition = boardMap.filter(el => el.name === player.lastPosition)[0];
      let currentPosition = nextPosition !== null ? nextPosition : this.playerInitGame.includes(playerInit) ? direction === 'right' ? boardMap.indexOf(elementPosition) + 1 : boardMap.indexOf(elementPosition) - 1 : boardMap.indexOf(elementPosition);

      // FIX
      if(currentPosition === boardMap.length) {
        currentPosition = boardMap.length - 1;
      }

      const positions = boardMap[currentPosition].positions;

      this.players[this.turn].lastPosition = boardMap[currentPosition].name;

      const pos = positions[this.turn];
      const newPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      this.threeManager.moveModelToPosition(this.players[this.turn], newPos);

      nextPosition = this.nextPosition(boardMap.length, direction, this.players[this.turn]?.lastPosition)

      if(!this.playerInitGame.includes(playerInit)) {
        this.playerInitGame.push(playerInit);
        // console.log(this.playerInitGame)
      }

      positionIndex++;
    }, 500);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.threeManager.render();
  }
}

const content = document.getElementById("root");
const game = new Game(content);
