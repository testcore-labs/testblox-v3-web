// new core.js because old one was built on top since last year lol
const elem = document.querySelector.bind(document);
const elems = document.querySelectorAll.bind(document);
const api_endpoint = {
  v1: "/api/v1",
};

// if image fails to load, this will set a fallback.
(async () => {
  document.addEventListener("DOMContentLoaded", () => {
    let fallback = "/assets/img/unknown.png"
    let imgs = elems("img");
  
    const set_fallback = (img, og) => {
      img.setAttribute("original-src", og);
      img.src = fallback;
    }

    imgs.forEach((img) => {
      let original_img = img.src;
      // ends with .svg is a hack because firefox has a bug with svgs 
      // where they always return natural* as 0 if svg is dimensionless, still not fixed 
      window.addEventListener("load", () => {
        if((img.naturalWidth == 0 || img.naturalHeight == 0) && !original_img.endsWith(".svg")) {
          set_fallback(img, original_img);
        }
      });
      img.addEventListener("error", () => {
        set_fallback(img, original_img);
      });
    });
  });
})();

(async () => {
  let loggedin = await fetch(`${api_endpoint.v1}/isloggedin`).then((response) => {
    return response.json();
  });
  
  async function keep_alive() {
    await fetch(`${api_endpoint.v1}/keep_alive`);
  }

  if(loggedin.success) {
    keep_alive();
    setInterval(async () => {
      await keep_alive();
    }, 30000);
  }
})();