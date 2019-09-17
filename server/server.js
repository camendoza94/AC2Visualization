const glob = require('glob');
const initial = require('./architecture');
const axios = require('axios');

let architecture = JSON.parse(JSON.stringify(initial));
let mod = {};
let data = {};

function getPath(s) {
    let parts = s.split("/");
    let path = "";
    for (let i = 6; i >= 0; i--) {
        if (i === 0)
            path += parts[parts.length - 1 - i];
        else
            path += parts[parts.length - 1 - i] + "/";
    }
    return path;

}

const getFiles = async (src) => {
    let currentData = data.find(project => project.name === require('path').basename(process.cwd())).data[0];
    architecture.name = require('path').basename(process.cwd());
    architecture.children.forEach((child) => {
        mod = child;
        child.pattern.forEach((pattern) => {
            let res = glob.sync(src + pattern);
            let newRes = res.map(file => {
                let found = currentData.files.find(f => f.name === getPath(file));
                let sum = found && found.issues ? found.issues.reduce((a, b) => a + b, 0) : 0;
                let authors = found && found.authors ? found.authors : [];
                let outDeps = found && found.dependenciesOut ? found.dependenciesOut : [];
                let inDeps = found && found.dependenciesIn ? found.dependenciesIn : [];
                return {
                    name: file.split("/")[file.split("/").length - 1],
                    size: sum,
                    children: authors,
                    outDeps,
                    inDeps
                }
            });
            architecture.children.find(child => child.name === mod.name).children.push(...newRes);
        });
    });
};

const getIssues = () => {
    axios.get("https://archtoringbd.herokuapp.com/files").then(async (response) => {
        data = response.data;
        await getFiles('./');
        axios.put(`https://archtoringbd.herokuapp.com/architecture/${require('path').basename(process.cwd())}`, architecture).then((response) => {
            console.log(response);
        })
    })
};

getIssues();
