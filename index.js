import http from 'http';
import fetch from 'node-fetch';

const variables = {
    token: "Your Github Token",
    username: "your username"
};

const body = {
    query: `
    query ($username: String!) {
        user(login: $username) {
          name
          repositories(ownerAffiliations: OWNER,first: 100, isFork: false) {
            nodes {
              name
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    color
                    name
                  }
                }
              }
            }
          }
        }
      }
    `, variables
};

const base_url = "https://api.github.com/graphql";

const headers = {
    "Content-Type": "application/json",
    "Authorization": `bearer ${variables.token}`
}

fetch(base_url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
}).then(res => res.json()).then(dataa => {

    // all coding goes here

    let top_lang = manageData(dataa);
    sendData(top_lang);
    // console.log(top_lang);
}).catch(err => console.log(JSON.stringify(err)));

function manageData(dataa) {
    const languages = [];
    const extratedData = dataa.data.user;

    const repos = extratedData.repositories.nodes;

    const repoSize = [];

    const EachLangSize = [];
    const lang_size = [];

    repos.forEach(repo => {

        let repoLang = repo.languages.edges;

        const repoLangNameSize = [];
        let repo_size = 0;

        repoLang.forEach(elem => {
            let repoLangName = elem.node.name;
            let repoLangSize = elem.size;

            repo_size += repoLangSize;

            repoLangNameSize.push(repoLangName, repoLangSize);

            !languages.includes(repoLangName) ? languages.push(repoLangName) : "";

            if (languages.includes(repoLangName)) {
                let index = languages.indexOf(repoLangName)
                EachLangSize[index] = !isNaN(EachLangSize[index]) ? EachLangSize[index] + repoLangSize : repoLangSize;
            }
        })

        repo_size != 0 ? repoSize.push({ name: repo.name, size: repo_size }) : "";
    });

    // console.log(repoSize);   // working fine

    // console.log(languages);  // working fine

    // console.log(EachLangSize);   // working fine

    let totalLangSize = 0;
    languages.forEach((e, i) => {
        lang_size.push({ name: e, size: EachLangSize[i] });
        totalLangSize += EachLangSize[i];
    });
    totalLangSize = `${totalLangSize / 1000}kb`;

    // console.log(lang_size);  // working fine

    // console.log(totalLangSize);  // working fine

    const percentage = [];
    lang_size.forEach((e, i) => {
        let total = totalLangSize.slice(0, -2) * 1000;
        percentage.push({ name: e.name, percentage: `${((e.size / total) * 100).toFixed(2)}%` });
    }
    );



    // console.log(extratedData.name);
    // console.log(sortArr(percentage));
    // console.log("Total Size = ", totalLangSize);

    let res = {
        name: extratedData.name,
        percentage: sortArr(percentage),
        totalSize: totalLangSize
    }
    //  console.log(res);
    return res;
}

function sortArr(arr) {
    let first = Object.keys(arr[0])[0];
    let second = Object.keys(arr[0])[1];
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
            if (parseFloat(arr[j][second]) < parseFloat(arr[i][second])) {
                let temp = arr[j];
                arr[j] = arr[i];
                arr[i] = temp;
            }
        }
    }

    // console.log("arr=", arr);
    return arr;
}

function sendData(data) {

    let lang_str = "<table>";
    for (const key of data.percentage) {
        // lang_str += `${key.name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${key.percentage}<br>`;
        lang_str += `
                        <tr>
                            <td>${key.name}</td>
                            <td>${key.percentage}</td>
                        </tr>
                        `;
    }

    lang_str += "</table>";

    const hostname = '127.0.0.1';
    const port = 3000;

    const server = http.createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');

        res.end(
            `
            <h2>${data.name}</h2>
            ${lang_str}
            Total Size = ${data.totalSize}
            `
        );
    });

    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
}