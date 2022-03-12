window.addEventListener('load', () => {
  document.querySelectorAll('.gallery-item').forEach((item) => {
    let img = item.querySelector('img');
    let vanity = item.dataset.vanity;
    if (vanity && img) {
      img.addEventListener('click', () => {
        navigator.clipboard.writeText(vanity);
      })
    }
  });
})
