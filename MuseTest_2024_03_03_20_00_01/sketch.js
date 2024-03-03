let neuralNetwork;
let osc;

var baseRadius = 200; // 初始半径
var flying = 0;
var maxPhi = 0; // 用于控制球体生成动画的变量

//how many data points are in the JSON?
//hz bins
//cut off everything above 50 to avoid 50 hz wall outlet noise
let INPUTS_TOTAL = 48; 

//how many outputted classifications are in the JSON?
/*
n disconnection noise
1 loose connection
r resting
s stress
b blink
j jaw
m muscle furrow on forehead
f focus
g gamma joy
c clear mind
m meditate
d dreaming
*/

let OUTPUTS_TOTAL = 8;

//how many times does the model get analyzed?
//this can be reduced to the number where the loss drops and stays low in the Training Performance chart (which is visible when debug is TRUE)
let EPOCHS = 225

//classification (specific outputs with %)
//or regression (a percentage fade between specific points)
let MODEL_TYPE = "classification"; //or "regression"

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

    angleMode(DEGREES);
    //background(230, 50, 15);
    stroke(180, 30, 100);
    strokeWeight(2); // 设置点的大小
  
  
  
  
  
  setupMuse();
  osc = new p5.Oscillator('sine');
  
  

  //setup NN
  let options = {
    inputs: INPUTS_TOTAL,
    outputs: OUTPUTS_TOTAL,
    task: MODEL_TYPE,
    debug: true,
  };
  neuralNetwork = ml5.neuralNetwork(options);
  
  //load in data that has already been recorded
  //do this if you want to add more data to the existing data
  //neuralNetwork.loadData("JSON-data/added-alpha.json", jsonDataLoaded);
  
  //using loadData and loadTrainingModel at the same time can produce an error if there are differences between them
  
  //load this when testing live data against the ML model
  loadTrainingModel();
}

//LOAD JSON DATA OF MENTAL STATES
function jsonDataLoaded(){
  console.log("JSON data loaded")
  
  //when you want to create a train model...
  trainModel();
}

//TRAINS NN ON JSON DATA
function trainModel(){
  
  console.log("start training model")
  
  //convert all data to be between 0.0 and 1.0
  neuralNetwork.normalizeData();
  
  //train the neural network
  neuralNetwork.train({
      epochs: EPOCHS
    }, trainingComplete);
}

function trainingComplete(){
  console.log("training complete")
  
  //when happy with loss value
  //and num of epochs tests
  //and ready to download model
  neuralNetwork.save();
}

//TRAINING MODEL TO CLASSIFY CURR MENTAL STATE
function loadTrainingModel(){

  const modelInfo = {
    model: "model/model.json",
    metadata: "model/model_meta.json",
    weights: "model/model.weights.bin",
  };

  neuralNetwork.load(modelInfo, trainingModelLoaded);
}

function trainingModelLoaded() {
  console.log("Training model is loaded");
  
  //start interval for how frequent the live EEG data is examined
  setInterval(classifyLiveEEG, 50)
}

function classifyLiveEEG(){
  
  //only classify if live data is coming from the headset
  if (eegSpectrum[0] > 0) {
    let hzBins = eegSpectrum.slice(0, 48);
    neuralNetwork.classify(hzBins, stateDetected);
  }
}

function stateDetected(error, results){
 
  if (error) {
    console.log("stateDetected error:", error);
    return;
  } else {
    
    
    let topResult = results[0];
    //let label = topResult.label;
    let confidence = topResult.confidence.toFixed(4);
    //if (confidence > 0.98) {
      //console.log(label, confidence)
    //}
    
    let printStr = "" + confidence + " ";
    for (let i = 0; i < results.length; i++) {
      printStr += results[i].label + " ";
    } 
    console.log(printStr)
    //console.log(results[0].label, results[1].label, results[2].label)
    
    if (results[0].label == "a") {
      osc.start();
      osc.freq(300);
      
    } else if (results[0].label == "d") {
//       osc.start();
//       osc.freq(150);
      
    } else {
      osc.stop();
    }
    
    
    
  }
}


//KEY COMMANDS
//used to trigger a snapshot for the JSON data
function keyPressed() {
  
  if (key == "S") {
    neuralNetwork.saveData();
    
  } else {
    
    let hzBins = eegSpectrum.slice(0, 48);

    let target = [key];
    console.log("Store EEG for", key)

    neuralNetwork.addData(hzBins, target);
  }
}

//VISUAL RENDER
function draw() {
  //background(200);

  // EEG chart
  //beginShape();
  strokeWeight(1);
  noFill();
  stroke(255, 255, 255);
  
  background(0);
  orbitControl(4, 4);
  flying -= 0.05;

    maxPhi += 2; // 每帧增加绘制的角度范围
    if (maxPhi > 360) maxPhi = 360; // 限制最大范围以避免无限增加

    for (let phi = 0; phi <= maxPhi; phi += 5) { // 使用maxPhi控制phi的循环范围
        beginShape(POINTS);
        for (let theta = 0; theta <= 180; theta += 5) {
            let noiseFactor = noise(phi * 0.1 + 1, theta * 0.1, flying);
            let r = baseRadius + map(noiseFactor, 0, 1, -50, 50);
            let pX = r * sin(phi) * sin(theta);
            let pY = -r * cos(phi);
            let pZ = r * sin(phi) * cos(theta);
            vertex(pX, pY, pZ);
        }
        endShape();
    }
  
  
  
  
  
  

//   for (let i = 1; i <= eegSpectrum.length / 2; i++) {
//     let x = map(i, 0, 48, 0, width);
//     let y = map(eegSpectrum[i], 0, 50, height, 0);
//     vertex(x, y); //<-- draw a line graph
//   }
//   endShape();

//   noStroke();
//   fill(0, 0, 0);
//   textSize(10);
//   text("BATTERY: " + Math.floor(batteryLevel), width - 80, 10);

//   textSize(12);
//   text('DELTA: ' + eeg.delta.toFixed(0), 10, 30);
//   text('THETA: ' + eeg.theta.toFixed(0), 10, 45);
//   text('ALPHA: ' + eeg.alpha.toFixed(0), 10, 60);
//   text('BETA:  ' + eeg.beta.toFixed(0),  10, 75);
//   text('GAMMA: ' + eeg.gamma.toFixed(0), 10, 90);

//   if (ppg.heartbeat) {
//     text('HEART bpm: ' + ppg.bpm + ' •', 10, 120);
//   } else {
//     text('HEART bpm: ' + ppg.bpm, 10, 120);
//   }

 
  
//   text('ACCEL X: ' + accel.x.toFixed(2), 10, 150);
//   text('ACCEL Y: ' + accel.y.toFixed(2), 10, 165);
//   text('ACCEL Z: ' + accel.z.toFixed(2), 10, 180);

//   text('GYRO X: ' + gyro.x.toFixed(2), 10, 210);
//   text('GYRO Y: ' + gyro.y.toFixed(2), 10, 225);
//   text('GYRO Z: ' + gyro.z.toFixed(2), 10, 240);
}



function keyPressed() {
    if (key == 'P' || key == 'p') { // 检查是否按下了“P”键
        saveCanvas('mySphereAnimation', 'jpg'); // 保存画布
    }
}
