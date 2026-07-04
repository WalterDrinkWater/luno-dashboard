const About = {
  init() {
    const container = document.getElementById("about-content");
    if (!container) return;

    fetch("README.MD")
      .then((r) => r.text())
      .then((md) => {
        if (typeof marked !== "undefined" && marked.parse) {
          container.innerHTML = marked.parse(md);
        } else {
          container.textContent = md;
        }
      })
      .catch(() => {
        container.innerHTML = "<p>Failed to load README.</p>";
      });
  },
};
