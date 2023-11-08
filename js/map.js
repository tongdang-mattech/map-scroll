const BASEMAP_ID = "base-map";
const LOCATION_ID = "location-map";
function setBaseMap(map, item) {
  let layerId = `${BASEMAP_ID}`;

  map.addLayer(
    {
      id: layerId,
      type: "raster",
      source: {
        type: "raster",
        tiles: item.links,
        maxzoom: item.maxzoom || 22,
        minzoom: item.minzoom || 0,
        tileSize: item.tileSize || 256,
      },
    },
    getLowestLayerId(map)
  );
}
function setLayerForLocation(map) {
  map.addSource(LOCATION_ID + "-source", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });
  map.addLayer({
    id: LOCATION_ID + "-layer",
    type: "line",
    source: LOCATION_ID + "-source",
    layout: {},
    paint: {
      "line-color": "#0080ff",
      "line-width": 5,
    },
  });
}
function setLocation(map, data) {
  let source = map.getSource(LOCATION_ID + "-source");
  if (!source) {
    setLayerForLocation(map);
    source = map.getSource(LOCATION_ID + "-source");
  }
  source.setData(data);
}
function getLowestLayerId(map) {
  const layers = map.getStyle().layers;

  return layers.length > 0 ? layers[0].id : null;
}
function setLocationMakers(map, items) {
  return items.reduce((acc, item) => {
    let marker = getMarkerNode(item).setLngLat(item.coordinate).addTo(map);
    console.log(item.coordinate);
    if (item.title) {
      setPopupForMaker(item, marker);
    }
    acc[item.id] = marker;
    return acc;
  }, {});
}

window.onload = () => {
  let markers = {};
  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "https://demotiles.maplibre.org/style.json",
    center: window.data.center ?? [-79.41320306327765, 43.665505203534224], // starting position [lng, lat]
    zoom: window.data.zoom ?? 13, // starting zoom
  });
  var nav = new mapboxgl.NavigationControl();
  map.addControl(nav, "bottom-right");

  map.once("load", () => {
    let style = map.getStyle();
    style.sources = {};
    style.layers = [];
    map.setStyle(style);
    setBaseMap(map, {
      links: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
    });
    setLayerForLocation(map);
    setLocation(map, window.data.path);
    markers = setLocationMakers(map, window.data.items);
  });
  function goToItem(map, id) {
    for (let key in markers) {
      let marker = markers[key];
      const element = marker.getElement();
      element.classList.remove("is-highlighted");
    }
    let marker = markers[id];
    const element = marker.getElement();
    element.classList.add("is-highlighted");
    map.flyTo({
      center: marker.getLngLat(),
      zoom: 15,
    });
  }

  scrollTrigger(".js-section", {
    cb: (el) => {
      let id = el.getAttribute("data-id");
      goToItem(map, id);
    },
  });
  scrollTrigger(".js-section-reset", {
    cb: (el) => {
      console.log("🚀 ~ el", el);
    },
  });
};
function setPopupForMaker(item, marker) {
  const popup = new mapboxgl.Popup({
    offset: 25,
    closeButton: false,
    closeOnClick: false,
    maxWidth: "250px",
  }).setHTML(createHtml(item));
  marker.setPopup(popup);
  const markerDiv = marker.getElement();
  markerDiv.addEventListener("mouseenter", () => marker.togglePopup());
  markerDiv.addEventListener("mouseleave", () => marker.togglePopup());
}
function createHtml(item) {
  let image = "";
  if (item.image) {
    image = `<img src="${item.image}" class="step-popup__image" style="opacity: 1; transition: opacity 0.2s ease-in-out 0s;">`;
  }
  return `<div class="step-popup ${item.image ? "step-popup__with-image" : ""}">
    <div class="step-popup__content">
      ${image}

      <div class="step-popup__text">
        <div class="text-m step-popup__description"> ${item.description}
        </div>
        <div class="text-s step-popup__arrived"> ${item.title}
        </div>
      </div>
    </div>
  </div>`;
}
function getMarkerNode(item) {
  const node = document.createElement("div");
  node.style.width = "14px";
  node.style.height = "14px";
  node.className = "step-marker step-marker-with-description";
  if (item.image) {
    node.className = "step-marker step-marker-with-image";
    node.style.width = "30px";
    node.style.height = "30px";
    node.style.borderWidth = "2px";
    const image_container = document.createElement("div");
    image_container.className =
      "object-fit-image object-fit-image__cover step-marker-image-container";
    const image = document.createElement("img");
    image.src = item.image;
    image_container.appendChild(image);
    node.appendChild(image_container);
  }
  node.onclick = () => {
    let element = document.querySelector(
      '.js-section[data-id="' + item.id + '"]'
    );
    if (element) {
      element.scrollIntoView();
    }
  };
  return new mapboxgl.Marker({
    element: node,
    draggable: false,
  });
}

function scrollTrigger(selector, options = {}) {
  let els = document.querySelectorAll(selector);
  els = Array.from(els);
  els.forEach((el) => {
    addObserver(el, options);
  });
}

function addObserver(el, options) {
  if (!("IntersectionObserver" in window)) {
    if (options.cb) {
      options.cb(el);
    } else {
      entry.target.classList.add("active");
    }
    return;
  }
  let observer = new IntersectionObserver((entries, observer) => {
    //this takes a callback function which receives two arguments: the elemts list and the observer instance
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (options.cb) {
          options.cb(el);
        } else {
          entry.target.classList.add("active");
        }
        // observer.unobserve(entry.target);
      }
    });
  }, options);
  observer.observe(el);
}
