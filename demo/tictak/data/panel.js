var button = document.getElementsByTagName('button')[0];

button.addEventListener('click', function () {
  self.port.emit('click', 1);
}, false);

self.port.on('update', function (n) {
  button.innerHTML = "I've been clicked " + n + " times";
});

