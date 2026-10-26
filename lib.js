// @ts-nocheck
import { loadEnvFile } from 'node:process';
import { readFile } from 'fs/promises';

try {
    loadEnvFile('.env.local');
} catch (ignored) { }

const EMAG_USER_REMEMBER_COOKIE = process.env.EMAG_USER_REMEMBER_COOKIE;
if (!EMAG_USER_REMEMBER_COOKIE)
    console.log("EMAG_USER_REMEMBER_COOKIE not found.");
const EMAG_FAV_LIST_ID = process.env.EMAG_FAV_LIST_ID;
const EMAG_FAV_LIST_ITEM_LIMIT = process.env.EMAG_FAV_LIST_ITEM_LIMIT || 25;


export async function favouritesToMarkdownJson(history) {
    const favourites = await fetchFavourites();
    const offers = await fetchOffers(favourites);
    const products = extractProducts(favourites, offers, history);
    return convertToMarkdownAndJson(products);
}


export async function fetchFavourites() {
    console.log('Fetching favourites list...')
    const response = await fetch(`https://www.emag.ro/favorites/${EMAG_FAV_LIST_ID}/products?limit=${EMAG_FAV_LIST_ITEM_LIMIT}`, {
        "cache": "default",
        "credentials": "include",
        "headers": {
            "Accept": "application/json",
            "Cookie": `user_remember=${EMAG_USER_REMEMBER_COOKIE}`,
        },
        "method": "GET",
    });
    const contentType = response.headers.get('content-type') || '';

    let body;
    if (contentType.includes('application/json')) {
        body = await response.json();
    } else {
        const text = await response.text();
        console.log('emag service responded with:', text);
        throw new Error("Invalid emag response content type: " + contentType);
    }
    if (!response.ok) {
        console.log(body);
        throw new Error("Response status: " + response.status);
    }
    const favourites = body.data.items;
    console.log('Done.');
    return favourites;
}


export async function fetchOffers(favourites) {
    console.log('Fetching offers list...');
    const offersListrequestBody = new URLSearchParams();
    offersListrequestBody.append("source_id", "7");
    favourites.forEach(({ product_details }) => offersListrequestBody.append("offers[]", product_details.offer.id.toString()));
    const response = await fetch("https://sapi.emag.ro/voucher-campaign/listing", {
        "headers": {
            "accept": "application/json",
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "cookie": `user_remember=${EMAG_USER_REMEMBER_COOKIE}`,
        },
        "method": "POST",
        "body": offersListrequestBody,
    });
    const body = await response.json();
    if (!response.ok) {
        console.log(body);
        throw new Error("Response status: " + response.status);
    }
    const offers = body.data?.offers || [];
    console.log('Done.');
    return offers;
}


export function extractProducts(favourites, offers, history) {
    return favourites.map(({ product_details }) => {
        let price = product_details.offer.price.current;
        const discountPercent = _getOfferDiscountValue(product_details.offer.id, offers);
        price -= price * discountPercent / 100;
        let product = {
            id: product_details.id,
            url: product_details.url.desktop_base + product_details.url.path,
            name: product_details.name,
            imageUrl: product_details.image.resized_images.find(it => it.size === '200x200')?.url
                || product_details.image.original,
            partNumberKey: product_details.part_number_key,
            price: price,
            availability: product_details.offer.availability.text,
        }
        product.lowestPrice = _getLowestPrice(product, history);
        return product;
    })
        .toSorted((a, b) => new Date(b.lowestPrice.date) - new Date(a.lowestPrice.date));
}


// grab from markdown - starting from [history]
export function getHistory(markdown) {
    let historyJsonStr = markdown.split("```json")[1]?.trim().split("```")[0];
    if (!historyJsonStr) return [];
    return JSON.parse(historyJsonStr);
}


export function convertToMarkdownAndJson(products) {
    const now = new Date();
    const markdownLines = [`Ultima actualizare: ${_formatDate(now)} [${process.env.SOURCE}]\n`];

    console.log('Converting products to Markdown...');
    for (let product of products) {
        markdownLines.push(
            `### [${product.name}](${product.url})`,
            `![${product.name}](${product.imageUrl})`,
            `- **Part Number:** ${product.partNumberKey}`,
            `- **Price:** ${_formatNumber(product.price)}`,
            `- **Lowest price:** ${_formatNumber(product.lowestPrice.price)} (${_formatDate(product.lowestPrice.date)})`,
            `- **Availability:** ${product.availability}`,
            '---',
        );
    }
    const json = JSON.stringify({ last_run: now.toISOString(), products: products }, null, 2);
    const markdown = markdownLines.join('\n') +
        "\n<details>\n<summary>[history]</summary>\n```json\n" + json + "\n```\n</details>";
    console.log('Done.');
    return { markdown, json };
}


function _formatNumber(number) {
    return new Intl.NumberFormat("ro", { maximumFractionDigits: 0 })
        .format(Math.round(number));
}

function _formatDate(date) {
    if (typeof date === 'string')
        date = _parseDate(date)
    return new Intl.DateTimeFormat("ro", { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Bucharest' })
        .format(date);
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

function _getOfferDiscountValue(offerId, offers) {
    const offer = offers.find(it => it.offer_id === offerId);
    if (!offer) return 0;
    return offer.discount_value;
}

function _getLowestPrice(product, history) {
    const now = new Date();
    const historicalProduct = history.products?.find(it => it.id === product.id);
    if (historicalProduct) {
        const newLow = product.price < historicalProduct.lowestPrice.price;
        return {
            price: newLow ? product.price : historicalProduct.lowestPrice.price,
            date: newLow ? now.toISOString() : historicalProduct.lowestPrice.date,
        };
    } else {
        return {
            price: product.price,
            date: now,
        };
    }
}
