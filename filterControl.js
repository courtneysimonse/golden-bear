
const filters = {};

class filterControl {
    constructor(options) {
        if (!options || !options.categories || !options.data) {
            throw new Error('Invalid options. "categories" and "data" are required.');
        }
        this._categories = options.categories;
        this._data = options.data;
    }
    onAdd(map) {

        const categories = this._categories;
        const data = this._data;

        this._map = map;
        this._container = document.createElement('div');
        this._container.classList = 'maplibregl-ctrl data-filters';

        const header = document.createElement('h4');
        header.textContent = 'Filters';
        this._container.appendChild(header);

        const helpBtn = document.createElement('button');
        helpBtn.dataset.bsContainer = "body";
        helpBtn.dataset.bsToggle = "popover";
        helpBtn.dataset.bsPlacement = "left";
        helpBtn.dataset.bsContent = `Expand a category and uncheck an item to filter out those images. 
            Uncheck a category heading to stop using that filter (all images return).`;

        helpBtn.textContent = '?';
        helpBtn.classList.add('btn', 'btn-dark');

        helpBtn.addEventListener('click', (e) => {

        })

        this._container.appendChild(helpBtn);

        categories.forEach(c => {

            const summary = addSummary(c);

            let options = [];

            if (filters[c] == undefined) {
                filters[c] = {"status": "on", "values": []};
            }

            data.forEach(d => {
                if (d.properties[c]) {
                    let v = d.properties[c];
                    if (Array.isArray(v)) {
                        v.forEach(i => {
                            if (!options.includes(i)) {
                                filters[c].values.push(i)
                                if (i == '' && !options.includes('')) {
                                    options.push("Unknown");
                                } else {
                                    if (c == 'HEX CODE') {
                                        options.push(i.toUpperCase());
                                    } else {
                                        options.push(i);
                                    }
        
                                }
                                
                            } 
                        });
                    } else {
                        if (!options.includes(v)) {
                            filters[c].values.push(v)
                            if (v == '' && !options.includes('')) {
                                options.push("Unknown");
                            } else {
                                if (c == 'HEX CODE') {
                                    options.push(v.toUpperCase());
                                } else {
                                    options.push(v);
                                }
    
                            }
                            
                        } 
                    }
                    
                    
                }
        
            })

            options.sort();
            
            if (options.length > 0) {
                const details = createDetails(options);
                details.dataset.filter = c;
                details.appendChild(summary);

                this._container.appendChild(details);

            } else {
                this._container.appendChild(summary);
            }

            
        });

        return this._container;

    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }

    startingFilters() {
        return filters;
    }


}

function addSummary(category) {
    const summary = document.createElement('summary');

    let input = document.createElement('input');
    input.type = 'checkbox';
    input.classList.add('image-filter-heading');
    input.id = `check-${category.replaceAll(' ','-')}`;
    input.dataset.category = category;
    input.checked = true;

    summary.appendChild(input)

    const span = document.createElement('span');
    span.textContent = category;

    summary.appendChild(span);

    return summary;
}

function createDetails(options) {
    const details = document.createElement('details');
    
    const ul = document.createElement('ul');
    ul.classList = 'filter-ul';

    options.forEach(l => {
        let li = document.createElement('li');
        li.dataset.name = l;
        
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.classList.add('image-filter');
        input.id = `${l.replaceAll(' ','-')}`;
        input.dataset.name = l;
        input.checked = true;
        
        li.appendChild(input);

        const label = document.createElement('label');
        label.textContent = l;
        label.setAttribute('for', `${l.replaceAll(' ','-')}`);
        label.classList.add('form-label');

        li.appendChild(label);

        ul.appendChild(li);
    })

    details.appendChild(ul);

    return details;
    
}

export default filterControl;