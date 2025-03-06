class LayerControl {
    constructor(options) {
        if (!options || !options.map || !options.layers) {
            throw new Error('Invalid options. "map" and "layers" are required.');
        }
        this._map = options.map;
        this._layers = options.layers;
    }

    add(div) {
        this._div = div;
        this._container = document.createElement('div');
        this._container.classList = 'data-filters';

        for (const layer of this._layers) {
            const layerElement = document.createElement("div");

            const layerCheck = document.createElement("input")
            layerCheck.type = "checkbox";
            layerCheck.classList.add("layer-filter");
            layerCheck.setAttribute("name", layer); 
            layerCheck.setAttribute("id", layer);

            const layerLabel = document.createElement("label");
            layerLabel.setAttribute("for", layer)
            layerLabel.innerText = layer;

            const visibility = this._map.getLayoutProperty(layer, "visibility")
            
            if (visibility == undefined || visibility == "visible") {
                layerCheck.setAttribute("checked", true);
            }

            layerCheck.addEventListener("change", (e) => {
                if (e.target.checked) {
                    this._map.setLayoutProperty(layer, "visibility", "visible");
                } else {
                    this._map.setLayoutProperty(layer, "visibility", "none");
                }
            })

            layerElement.appendChild(layerCheck);
            layerElement.appendChild(layerLabel);

            this._container.appendChild(layerElement);
        }


        div.appendChild(this._container);
        
        return this._container;
    }

    hideLayers(filterFunction) {
        const layersToHide = this.filterLayers(filterFunction);
        layersToHide.forEach(layer => {
            this.map.setLayoutProperty(layer.id, 'visibility', 'none');
        });
    }

    showLayers(filterFunction) {
        const layersToShow = this.filterLayers(filterFunction);
        layersToShow.forEach(layer => {
            this.map.setLayoutProperty(layer.id, 'visibility', 'visible');
        });
    }
}

export default LayerControl;