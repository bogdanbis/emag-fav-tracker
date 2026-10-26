// @ts-nocheck
import { writeFile } from 'node:fs/promises';
import history from './history.json' with { type: 'json' };

function _formatDate(date) {
    if (typeof date === 'string')
        date = _parseDate(date);
    return new Intl.DateTimeFormat("ro", { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Bucharest' })
        .format(new Date(date));
}

function _parseDate(dateStr) {
    if (dateStr.includes('-')) {
        return new Date(dateStr)
    } else if (dateStr.includes(', ')) {
        let [date, time] = dateStr.split(', ');
        let [day, month, year] = date.split('.');
        return new Date(`${year}-${month}-${day}T${time}Z`);
    } else if (dateStr.includes('.')) {
        let [day, month, year] = dateStr.split('.');
        return new Date(`${year}-${month}-${day}`);
    }
}

history.last_run = _parseDate(history.last_run);

history.products = history.products.map(product => {
    product.lowestPrice.date = _parseDate(product.lowestPrice.date);
    return product;
});

const PATH = '/Users/bogdannegoita/Code/emag-fav-price-tracker';

console.log('Writing JSON to file "history.json"');
await writeFile(PATH + '/history.json', JSON.stringify(history, null, 2), 'utf8');
console.log('Done.');
