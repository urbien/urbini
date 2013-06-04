define('lib/recorder', ['globals', 'lib/recorderWorker'], function(G) {

  var WORKER_PATH = G.serverName + '/js/lib/recorderWorker.js';

  var Recorder = function(source, cfg) {
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    this.node = this.context.createJavaScriptNode(bufferLen, 2, 2);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    var recording = false,
        currCommand = 'init',
        currCallback;
    
    worker.postMessage({
      command: currCommand,
      config: {
        sampleRate: this.context.sampleRate
      }
    });

    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
      console.log(currCommand);
    }

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      currCommand = 'record';
      worker.postMessage({
        command: currCommand,
        buffer: [
          e.inputBuffer.getChannelData(0),
          e.inputBuffer.getChannelData(1)
        ]
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      currCommand = 'clear';
      worker.postMessage({ command: currCommand });
    }

    this.getBuffers = function(cb) {
      currCallback = cb || config.callback;
      currCommand = 'getBuffers';
      worker.postMessage({ command: currCommand })
    }

    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      currCommand = 'exportWAV';
      worker.postMessage({
        command: currCommand,
        type: type
      });
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  }

//  window.Recorder = Recorder;
  return Recorder;
});
