import fs from 'fs';
import { DOMParser } from 'xmldom';
import sqlite3 from 'sqlite3';

if (process.argv.length !== 4) {
  console.log(
    'Usage:\n  node script.js <jargon.xml> <output.db>'
  );
  process.exit(1);
}

class JargonXML {
  constructor(filePath) {
    const xml = fs.readFileSync(filePath, 'utf8');
    this.doc = new DOMParser().parseFromString(xml, 'text/xml');
    this.entries = Array.from(
      this.doc.getElementsByTagName('entry')
    );
  }

  find(name) {
    const result = [];

    this.entries.forEach(entry => {
      const termNode = entry.getElementsByTagName('term')[0];
      const term = this.getText(termNode);

      if (new RegExp(name, 'i').test(term)) {
        const defNode = entry.getElementsByTagName('def')[0];
        const def = this.getText(defNode).replace(/\s{2,}/g, ' ');

        const found = { term, def };
        const abbrevNode = entry.getElementsByTagName('abbrev')[0];

        if (abbrevNode) {
          found.abbrev = Array.from(
            abbrevNode.getElementsByTagName('item')
          ).map(item => this.getText(item));
        }

        result.push(found);
      }
    });

    return result;
  }

  getText(node) {
    if (!node) return '';
    if (node.nodeType === 3) return node.textContent.trim();
    if (node.nodeType === 1) return this.getXml(node);
    return node.textContent.trim();
  }

  getXml(node) {
    let xml = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      xml += node.childNodes[i].toString();
    }
    return xml.trim();
  }
}

const inputFile = process.argv[2];
const dbFile = process.argv[3];

const jargon = new JargonXML(inputFile);

const db = new sqlite3.Database(dbFile);
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS terms (
       id INTEGER PRIMARY KEY,
       term TEXT,
       def TEXT
     )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS abbrev (
       id INTEGER PRIMARY KEY,
       term INTEGER,
       name TEXT,
       FOREIGN KEY(term) REFERENCES terms(id)
     )`
  );

  const terms = jargon.find('.');

  const insertTerm = db.prepare(
    'INSERT INTO terms(term, def) VALUES(?, ?)'
  );

  const insertAbbrev = db.prepare(
    'INSERT INTO abbrev(term, name) VALUES(?, ?)'
  );

  terms.forEach(term => {
    insertTerm.run(term.term, term.def, function (err) {
      if (err) return;

      const id = this.lastID;
      process.stdout.write(`${id}`);

      if (term.abbrev && term.abbrev.length) {
        term.abbrev.forEach(a => {
          insertAbbrev.run(id, a);
        });
        process.stdout.write(` ; ${term.abbrev.length} abrevs`);
      }

      process.stdout.write('\n');
    });
  });

  insertTerm.finalize();
  insertAbbrev.finalize();
});

db.close();