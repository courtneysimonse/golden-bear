// import { customers } from "./constants.js";
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@3.5.0/+esm';
import noUiSlider from 'https://cdn.jsdelivr.net/npm/nouislider@15.8.1/+esm';
class TimeFilter {
    constructor(containerId, startYear, endYear, onYearChange) {
        this.container = document.getElementById(containerId);
        this.startYear = DateTime.fromISO('1931');
        this.endYear = DateTime.now();
        this.onYearChange = onYearChange;

        this.selectedYears = [startYear, endYear]; // Start with full range

        this.render();
    }

    render() {
        let numYears = this.startYear.until(this.endYear).length('years');

        // Create a label to display the selected range of years
        const yearLabel = document.createElement('div');
        yearLabel.classList.add('year-label');
        yearLabel.innerText = `Years: ${this.startYear.toFormat('yyyy')} - ${this.endYear.toFormat('yyyy')}`;

        // Create a div to hold the noUiSlider
        const sliderDiv = document.createElement('div');
        sliderDiv.classList.add('noUiSlider');

        // Initialize the slider with two handles for the range
        noUiSlider.create(sliderDiv, {
            start: [this.startYear, this.endYear],
            range: {
                min: +this.startYear.toFormat('yyyy'),
                max: +this.endYear.toFormat('yyyy')
            },
            step: 1, // Increment by 1 year
            // tooltips: true,
            connect: true, // Visually connect the handles
            format: {
                to: (value) => Math.round(value), // Display as integer
                from: (value) => Number(value),
            },
            pips: {
                mode: 'positions',
                values: [0, 25, 50, 75, 100],
                density: 4,
                stepped: true
            }
        });

        // Handle slider updates for the range
        sliderDiv.noUiSlider.on('update', (values) => {
            this.selectedYears = values.map(v => Math.round(v));
            yearLabel.innerText = `Years: ${this.selectedYears[0]} - ${this.selectedYears[1]}`;
        });

        // Handle slider updates for the range
        sliderDiv.noUiSlider.on('set', (values) => {
            this.selectedYears = values.map(v => Math.round(v));
            yearLabel.innerText = `Years: ${this.selectedYears[0]} - ${this.selectedYears[1]}`;
            this.onYearChange(this.selectedYears);
        });

        // Append elements to the container
        this.container.innerHTML = ''; // Clear any previous content
        this.container.appendChild(yearLabel);
        this.container.appendChild(sliderDiv);
    }
}

export default TimeFilter;


// class TimeControl {
//     constructor({element}) {
//         this._parent = element;
//     }
//     onAdd(map) {
//         this._startDate = luxon.DateTime.fromISO('1931');
//         this._endDate = luxon.DateTime.now();
//         this._timeFrame = luxon.Interval(this._startDate, this._endDate);
//         this._selectedTime = luxon.Interval(this._startDate, this._endDate);
//         this._map = map;
//         this._container = document.createElement('div');
//         this._container.className = 'time';

//         let startDate = this._startDate;
//         let endDate = this._endDate;

//         let select = document.createElement('select');
//         select.id = 'time-filter';
//         let content = '';

//         let numYears = startDate.until(endDate).length('years');

//         const dateFormat = 'yyyy';
        
//         content += `<option value=${startDate.toFormat(dateFormat)}-${endDate.toFormat(dateFormat)}>${startDate.toFormat(dateFormat)} to ${endDate.toFormat(dateFormat)}</option>`
//         for (let i = 1; i < numYears; i++) {
//             let yearStart = startDate.plus({years: i-1});
//             let yearEnd = startDate.plus({years: i})
//             content += `<option value=${yearStart.toFormat(dateFormat)}-${yearEnd.toFormat(dateFormat)}>${yearStart.toFormat(dateFormat)} to ${yearEnd.toFormat(dateFormat)}</option>`
//         }

//         select.innerHTML = content;
//         this._container.appendChild(select);

//         let startEl = document.createElement('input');
//         startEl.id = 'start-pick';
//         let endEl = document.createElement('input');
//         endEl.id = 'end-pick';

//         const slider = document.createElement('div');
//         slider.id = "slider";

//         noUiSlider.create(slider,{
//             start: [0, numYears],
//             connect: true,
//             range: {
//                 'min': 0,
//                 'max': numYears
//             }
//         });

//         slider.noUiSlider.on('update', (values, handle) => {
//             var value = values[handle];
//             var date = startDate.plus({years: value}).toFormat('yyyy');

//             if (handle) {
//                 endEl.value = date;
//             } else {
//                 startEl.value = date;
//             }
//         })


//         startEl.addEventListener('change', function () {
//             let years = startDate.until(luxon.DateTime.fromFormat(this.value, 'yyyy')).length('years');
//             slider.noUiSlider.set([years, null]);
//         });

//         endEl.addEventListener('change', function () {
//             let yearss = startDate.until(luxon.DateTime.fromFormat(this.value, 'yyyy')).length('years');
//             slider.noUiSlider.set([null, years]);
//         });

//         this._container.appendChild(startEl);
//         this._container.appendChild(endEl);
//         this._container.appendChild(slider);

//         return this._container;
//     }
//     onRemove() {
//         this._container.parentNode.removeChild(this._container);
//         this._map = undefined;
//     }
//     formatDates(int, fmt) {
//         let dateArray = int.split('-');

//         return {
//             newStart: luxon.DateTime.fromFormat(dateArray[0],fmt),
//             newEnd: luxon.DateTime.fromFormat(dateArray[1],fmt)
//         }
//     }
//     addDateInputs() {
//         const start = datepicker('#start-pick', { 
//             id: 1, 
//             position: 'tl',
//             formatter: (input, date, instance) => {
//                 const value = luxon.DateTime.fromJSDate(date)
//                 input.value = value.toFormat('MM/dd/yy') // => '1/1/2099'
//               },
//             minDate: new Date(2022, 0, 1),
//             showAllDates: true,
//             dateSelected: new Date(2022,0,1)
//         })
        
//         const end = datepicker('#end-pick', { 
//             id: 1, 
//             position: 'tr',
//             formatter: (input, date, instance) => {
//                 const value = luxon.DateTime.fromJSDate(date)
//                 input.value = value.toFormat('MM/dd/yy') // => '1/1/2099'
//             },
//             showAllDates: true,
//             dateSelected: luxon.DateTime.now().toJSDate()
//          })
        

//     }
// }

// export default TimeControl