document.getElementById('loginContainer').onclick = function() {
  self.port.emit('start', '');
};

self.port.on('profile', function(data) {
  document.getElementById("profilepic").src = data.picture;
  if (data.link) {
    var link = document.createElement('a');
    link.href = data.link;
    link.innerText = data.name;
    document.getElementById("name").appendChild(link);
  } else {
    document.getElementById("name").appendChild(
        document.createTextNode(data.name));
  }
  if (typeof data.details === "string") {
    document.getElementById("subtitle").appendChild(
        document.createTextNode(data.details));
  }
  document.getElementById("details").appendChild(
      document.createTextNode(JSON.stringify(data)));
  document.body.className = "loaded";
});
