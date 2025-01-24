const filters = {};

class FilterControl {
    constructor(options) {
        if (!options || !options.categories || !options.data) {
            throw new Error('Invalid options. "categories" and "data" are required.');
        }
        this._categories = options.categories;
        this._data = options.data;
    }
    add(div) {
        
        const categories = this._categories;
        const data = this._data;
        
        this._div = div;
        this._container = document.createElement('div');
        this._container.classList = 'data-filters';
        
        categories.forEach(c => {
            
            const select = addSummary(c);
            
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
                                    options.push(i);
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
                const details = createDetails({select: select, items: options});
                details.dataset.filter = c;
                
                this._container.appendChild(details);
                
            } else {
                this._container.appendChild(summary);
            }
            
            
        });
        
        div.appendChild(this._container);
        
        return this._container;
        
    }
    
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._div = undefined;
    }
    
    startingFilters() {
        return filters;
    }
    
    
}

function addSummary(category) {
    
    let select = document.createElement('wa-select');
    select.classList.add('data-filter');
    select.id = `select-${category.replaceAll(' ','-')}`;
    select.dataset.filter = category;
    select.setAttribute('label', category);
    select.setAttribute('multiple', true);
    select.setAttribute('clearable', true);
    
    return select;
}

function createDetails(options) {
    
    const select = options.select;
    if (select) {
        options.items.forEach(item => {
            const option = document.createElement('wa-option');
            option.value = item.replaceAll(' ','_');
            option.textContent = item;
            select.appendChild(option);
        });
    }
    
    return select;
}

export default FilterControl;