const puppeteer = require('puppeteer');
const pug = require('pug')
const fs = require('fs').promises

class PdfService {
    constructor() {
        this.config = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-translate',
                '--disable-extensions',
                '--disable-sync',
            ]
        }

        this.initialized = false
        this.initialize()
    }

    async initialize() {
        if (this.initialized) return
        this.browser = await puppeteer.launch(this.config)
        this.initialized = true
    }

    async generateScoresheet(template, data) {
        if (!this.initialized) {
            await this.browser
        }

        const base64images = await Promise.all(Object.values(data.images).map(image_path => fs.readFile(image_path, {encoding: 'base64'}))).then(base64imageStrings => {
			const images = {}
			Object.keys(data.images).forEach((key, idx) => {
				images[key] = 'data:image/png;base64,' + base64imageStrings[idx]
            })
            return images
        })
        
        const scoresheetHtml = pug.renderFile(template, {
            ...data,
            images: base64images
        })

		const page = await this.browser.newPage()
		await page.setContent(scoresheetHtml)
		const pdfBuffer = await page.pdf({format: 'A4', margin: {top: "0.25in", left: "0.25in"}, printBackground: true })
        page.close()
        return pdfBuffer
    }
}

const PDF_Service = new PdfService()

module.exports = PDF_Service