window.addEventListener('load', () => {
  document.querySelectorAll('.single-lossless-link').forEach((item) => {
    if (item.dataset.url) {
      item.addEventListener('click', () => {
        navigator.clipboard.writeText(item.dataset.url);
      })
    }
  });
})
