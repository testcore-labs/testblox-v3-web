// new core.js because old one was built on top since last year lol
const elem = document.querySelector.bind(document);
const elems = document.querySelectorAll.bind(document);
const ws_protocol = (location.protocol === 'https:') ? "wss" : "ws";
const api_endpoint = {
  v1: "/api/v1",
};

const loaded = new Promise((resolve) => {
  document.addEventListener("DOMContentLoaded", resolve);
});

const utils = {
  get_cookie: (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if(parts.length === 2) return parts.pop().split(';').shift();
  },

  set_input_value: (value, input) => {
    input.value = value;
  }
}

let translate = {
  translation: {},

  set_lang: async (set_lang = null) => {
    if(!set_lang) set_lang = get_cookie("locale");
    let req = await fetch(`${api_endpoint.v1}/translation/get_all?locale=${set_lang}`);
    if(response.ok) {
      translate.translation = await req.json();
    }
  } 
}

const templater = {
  renderstr_elem: async (element, template, args = {}) => {
    if(translate.translation.length == 0) {
      await translate.set_lang();
    }
    element.innerHTML = nunjucks.renderString(
      template, { t: translate.translation, ...args });
  },
  render_elem: async (element, template, args = {}) => {
    if(translate.translation.length == 0) {
      await translate.set_lang();
    }
    element.innerHTML = nunjucks.render(
      template, { t: translate.translation, ...args });
  }
}

const cuser = {
  set_money_locally: async (amount) => {
    await loaded;
    amount = Number(amount);
    if(!Number.isNaN(amount)) {
      let money_div = elem(".cuser-money-div")
      let money_amount = elem(".cuser-money-amount")

      money_div.setAttribute("title", amount);
      money_amount.textContent = amount;
    }
  }
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
        if((img.naturalWidth === 0 || img.naturalHeight === 0) && !original_img.endsWith(".svg")) {
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

document.addEventListener("DOMContentLoaded", async () => {
  let cmd_ltrs = "";
  let cmd_match = "--cmd";
  let cmd_window = document.querySelector("#cmd_window");
  document.addEventListener('keyup', (event) => {
  cmd_ltrs += event.key;
  if(cmd_ltrs.length > cmd_match.length * 3) { // 3 tries
    cmd_ltrs = "";
  }
  if(cmd_ltrs.match(cmd_match)) {
    cmd_ltrs = "";
    cmd_window.classList.toggle("d-none");
  }
  });
});