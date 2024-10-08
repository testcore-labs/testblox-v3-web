const $ = document.querySelector.bind(document);

function randdelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function retype(element) {
  var isskipped;
  const text = element.textContent;
  element.textContent = '';
  const minspeed = parseInt(element.getAttribute("retype-minspeed")) ?? 15;
  const maxspeed = parseInt(element.getAttribute("retype-maxspeed")) ?? 50;
  const skipbtn = document.getElementById('skipretype');
  for (let i = 0; i < text.length; i++) {
    if(skipbtn) {
    skipbtn.addEventListener('click', function() {
    element.textContent = text;
    isskipped = true;
    });
    if(isskipped) {
    isskipped = false;
    break;
    }
    }
    element.textContent += text.charAt(i);
    await new Promise((resolve) => setTimeout(resolve, randdelay(minspeed, maxspeed)));
  }
}

async function retypeforeach(elements, index) {
  if (index < elements.length) {
    const element = elements[index];
    element.classList.remove('retype');
    
    await retype(element);

    index++;
    await retypeforeach(elements, index);
  }
}

document.addEventListener("DOMContentLoaded", () => {
retypeforeach(Array.from(document.getElementsByClassName('retype')), 0);
});

function setlang(locale) {
  let cookie = "locale=" +  locale + `;expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;SameSite=Lax;`;
  document.cookie = cookie;
  //console.log(cookie);
  location.reload();
}

function runhell() {
  javascript: (function () {
    console.log("running harlem shake.js")
    function c() {
        var e = document.createElement("link");
        e.setAttribute("type", "text/css");
        e.setAttribute("rel", "stylesheet");
        e.setAttribute("href", f);
        e.setAttribute("class", l);
        document.body.appendChild(e)
    }
    function h() {
        var e = document.getElementsByClassName(l);
        for (var t = 0; t < e.length; t++) {
            document.body.removeChild(e[t])
        }
    }
    function p() {
        var e = document.createElement("div");
        e.setAttribute("class", a);
        document.body.appendChild(e);
        setTimeout(function () {
            document.body.removeChild(e)
        }, 100)
    }
    function d(e) {
        return {
            height: e.offsetHeight,
            width: e.offsetWidth
        }
    }
    function v(i) {
      var s = d(i);
      if (i.tagName.toLowerCase() === 'body' || i.tagName.toLowerCase() === 'html') {
        return false;
      }
      return s.height > e && s.width > t;
  }  
    function m(e) {
        var t = e;
        var n = 0;
        while ( !! t) {
            n += t.offsetTop;
            t = t.offsetParent
        }
        return n
    }
    function g() {
        var e = document.documentElement;
        if ( !! window.innerWidth) {
            return window.innerHeight
        } else if (e && !isNaN(e.clientHeight)) {
            return e.clientHeight
        }
        return 0
    }
    function y() {
        if (window.pageYOffset) {
            return window.pageYOffset
        }
        return Math.max(document.documentElement.scrollTop, document.body.scrollTop)
    }
    function E(e) {
        var t = m(e);
        return t >= w && t <= b + w
    }
    function S() {
        var e = document.createElement("audio");
        e.setAttribute("class", l);
        e.src = i;
        e.loop = false;
        e.addEventListener("canplay", function () {
            setTimeout(function () {
                x(k)
            }, 500);
            setTimeout(function () {
                N();
                p();
                for (var e = 0; e < O.length; e++) {
                    T(O[e])
                }
            }, 15500)
        }, true);
        e.addEventListener("ended", function () {
            N();
            h()
        }, true);
        e.innerHTML = " <p>Buddy it's that time to get a new ass browser.</p>";
        document.body.appendChild(e);
        e.play()
    }
    function x(e) {
        e.className += " " + s + " " + o
    }
    function T(e) {
        e.className += " " + s + " " + u[Math.floor(Math.random() * u.length)]
    }
    function N() {
        var e = document.getElementsByClassName(s);
        var t = new RegExp("\\b" + s + "\\b");
        for (var n = 0; n < e.length;) {
            e[n].className = e[n].className.replace(t, "")
        }
    }
    var e = 0;
    var t = 0;
    var n = 350;
    var r = 350;
    var i = "/assets/snd/runhell/harlem-shake.mp3";
    var s = "mw-harlem_shake_me";
    var o = "im_first";
    var u = ["im_drunk", "im_baked", "im_trippin", "im_blown"];
    var a = "mw-strobe_light";
    var f = "/assets/css/runhell.css";
    var l = "mw_added_css";
    var b = g();
    var w = y();
    var C = document.getElementsByTagName("*");
    var k = null;
    for (var L = 0; L < C.length; L++) {
        var A = C[L];
        if (v(A)) {
            if (E(A)) {
                k = A;
                break
            }
        }
    }
    if (A === null) {
        console.warn("Could not find a node of the right size. Please try a different page.");
        return
    }
    c();
    S();
    var O = [];
    for (var L = 0; L < C.length; L++) {
      var A = C[L];
      if (v(A)) {
          O.push(A);
      }
  }  
})()
}







var stars = document.querySelectorAll('.star');
stars.forEach((star, index) => {
    star.addEventListener('mouseenter', () => {
        for (let i = 0; i <= index; i++) {
            stars[i].classList.add('active');
        }
    });

    star.addEventListener('mouseleave', () => {
        stars.forEach(s => {
            s.classList.remove('active');
        });
    });
});
function openify(calledfrom, forelem, hide_elems = [], opts = {}) {
  if(opts.length !== 0) {
    if(opts.click_outside_close) {
      document.addEventListener("click", (event) => clickoutside(forelem, event));
    }
  }

  function clickoutside(elem, event) {
    if(!elem.contains(event.target) && !calledfrom.contains(event.target)) {
      close(elem);
      document.removeEventListener("click", (event) => clickoutside(elem, event));
    }
  }

  function close(elem) {
    elem.removeAttribute("open");
  }

  if(!forelem.getAttribute("open")) {
    hide_elems.forEach(elem => {
      close(elem);
    });
    forelem.setAttribute("open", true);
  } else {
    close(forelem);
  }
}

function dropdownify(calledfrom, forelem) {

  function close() {
    forelem.removeAttribute("open");
    document.removeEventListener("keydown", escpress);
    document.removeEventListener("click", clickoutside);
  }

  function escpress(event) {
    if(event.code === "Escape") {
      close();
    }
  }

  function clickoutside(event) {
    if(!forelem.contains(event.target) && !calledfrom.contains(event.target)) {
      close();
    }
  }

  if(!forelem.getAttribute("open")) {
    forelem.setAttribute("open", true);
    document.addEventListener("keydown", escpress);
    document.addEventListener("click", clickoutside);
  } else {
    close();
  }
}

function popupify(calledfrom, forelem) {
  let close_btns = forelem.querySelectorAll(".popup-close");
  function close() {
    forelem.removeAttribute("open");
    document.removeEventListener("keydown", escpress);
    document.removeEventListener("click", clickoutside);
    document.removeEventListener("click", clickoutside);
    close_btns.forEach((close_btn) => {
      close_btn.removeEventListener("click", close);
    });
  }

  function escpress(event) {
    if(event.code === "Escape") {
      close();
    }
  }

  function clickoutside(event) {
    if(!forelem.contains(event.target) && !calledfrom.contains(event.target)) {
      close();
    }
  }


  if(!forelem.getAttribute("open")) {
    forelem.setAttribute("open", true);
    close_btns.forEach((close_btn) => {
      close_btn.addEventListener("click", close);
    });
    document.addEventListener("keydown", escpress);
    document.addEventListener("click", clickoutside);
  } else {
    close();
  }
}

document.addEventListener("DOMContentLoaded", function() {

const searchinput = document.getElementById("navbar-search");
const searchresults = document.getElementById("navbar-search-results");

if(searchinput && searchresults) {
searchinput.addEventListener("focus", () => {
  if(searchresults.classList.contains("d-none")) {
    searchresults.classList.remove("d-none");
  }
});

function clickoutside(event) {
  if(!searchresults.contains(event.target) && !searchinput.contains(event.target)) {
    searchresults.classList.add("d-none");
  }
}

document.addEventListener("click", clickoutside);

document.addEventListener("keydown", (event) => {
  if(event.code === "Escape" && !searchresults.classList.contains("d-none")) {
    searchresults.classList.add("d-none");
  }
});
}
});

var dragger = function() {
  return {
    move: function(divid, xpos, ypos) {
      divid.style.left = xpos + 'px';
      divid.style.top = ypos + 'px';
    },
    startmoving: function(divid, container, evt) {
      document.body.classList.add("userselectnoneall");
      var rect = divid.getBoundingClientRect();
      evt = evt || window.event;
      var offsetX = evt.clientX - rect.left,
        offsetY = evt.clientY - rect.top,
        posX = evt.clientX,
        posY = evt.clientY,
        divTop = divid.style.top,
        divLeft = divid.style.left,
        eWi = parseInt(divid.style.width),
        eHe = parseInt(divid.style.height),
        cSt = document.querySelector(container).style;

      if (cSt.position === "" || cSt.position === "static") {
        cSt.position = 'absolute';
      }

      divTop = divTop.replace('px', '');
      divLeft = divLeft.replace('px', '');
      var diffX = posX - divLeft,
        diffY = posY - divTop;
      document.onmousemove = function(evt) {
        rect = divid.getBoundingClientRect();
        evt = evt || window.event;
        var posX = evt.clientX,
          posY = evt.clientY,
          aX = posX - offsetX,
          aY = posY - offsetY;

        cSt.left = aX + 'px';
        cSt.top = aY + 'px';
        dragger.move(divid, 0, 0);
      };
      document.onmouseup = function() {
        dragger.stopmoving(divid, container);
      };
    },
    stopmoving: function(divid, container) {
      document.body.classList.remove("userselectnoneall");
      var containerElement = (container === "next") ? divid.nextSibling : ((container === "previous") ? divid.previousSibling : document.querySelector(container));
      containerElement.style.cursor = 'default';

      document.onmousemove = null;
      document.onmouseup = null;
    },
  };
}();

function search_onkeyup(_searchinput, clicked = false) {
  const rgx = /q=([^&]*)/;
  const href = String(window.location.href);
  const loc = href.replace(rgx, "q=" + _searchinput.value);
  const newloc = window.location.href.match(rgx) ? loc : "?q=" + _searchinput.value;
  if(clicked) {
    window.location.href = newloc;
  }
  _searchinput.addEventListener("keyup", function(event) {
    event.preventDefault();
    if(event.keyCode === 13) {
      window.location.href = newloc;
    }
  });
}

function search_html(input, tosearch) {
  const filter = input.value.toUpperCase();
  let tosearch_elems = tosearch.children; // if i swapped elems with children it would sound weird
  for(var i = 0, ii = tosearch_elems.length; i < ii; i++) {
    let div = tosearch_elems[i];
    let excluded = div.getAttribute("exclude-search-html") !== null;
    if(!excluded) {
    if(div && div !== input) {
      if(!(div.textContent.toString().toUpperCase()).includes(filter)) {
        div.style.display = "none";
      } else {
        div.style.display = "";
      }
    }
    }
  };
}

function htmx_tabs(elem, event) {
  if(event.target.tagName === 'BUTTON') {
  var ntab = elem.querySelector('[disabled]')
  if(ntab) {
  ntab.removeAttribute('disabled');
  }
  event.target.setAttribute('disabled', 'true');
  }
}