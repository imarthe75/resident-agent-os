"""scripts/outdated_dependencies.py y el verificador dependencies_current. El registro se simula (fetch inyectado); la corrida contra
repositorios reales queda como evidencia en el CHANGELOG."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("od", ROOT / "scripts" / "outdated_dependencies.py")
od = importlib.util.module_from_spec(spec)
spec.loader.exec_module(od)
from verifiers import checks  # noqa: E402

NPM = {
    "@angular/core": {"dist-tags": {"latest": "22.1.0"}, "versions": {"21.0.0": {}, "22.1.0": {}, "23.0.0-rc.1": {}}},
    "@angular/compiler-cli": {"dist-tags": {"latest": "22.1.0"}, "versions": {
        "21.0.0": {"peerDependencies": {"typescript": ">=5.9 <6.0"}}, "22.1.0": {"peerDependencies": {"typescript": ">=6.0 <6.1"}}}},
    "typescript": {"dist-tags": {"latest": "7.0.1"}, "versions": {"5.9.3": {}, "6.0.3": {}, "7.0.1": {}}},
    "primeng": {"dist-tags": {"latest": "22.0.0"}, "versions": {
        "21.0.2": {"peerDependencies": {"@angular/core": "^21.0.0"}}, "22.0.0": {"peerDependencies": {"@angular/core": "^22.0.0"}}}},
    "eslint": {"dist-tags": {"latest": "10.0.0"}, "versions": {"9.1.0": {"deprecated": "no longer supported"}, "10.0.0": {}}},
    "eslint-plugin-old": {"dist-tags": {"latest": "2.0.0"}, "versions": {"2.0.0": {"peerDependencies": {"eslint": "^8 || ^9"}}}},
}
MAVEN = {"org/springdoc/springdoc-openapi-starter-webmvc-ui": ["3.0.2", "3.2.1", "4.0.0-M1"],
         "org/apache/poi/poi-ooxml": ["5.4.0", "6.0.0"], "org/hibernate/orm/hibernate-core": ["7.1.0.Final", "7.2.3.Final", "8.0.0.CR1"]}
PLUGINS = {"org/springframework/boot": ["4.0.6", "4.2.0"]}
PYPI = {"fastapi": {"0.110.0": [{}], "0.120.0": [{}], "0.121.0b1": [{}]}}


def fake(url, accept):
    if url.startswith("https://registry.npmjs.org/"):
        name = url.rsplit("/", 1)[1] if "%2F" not in url and "/@" not in url else url[len("https://registry.npmjs.org/"):]
        name = name.replace("%2F", "/")
        if name not in NPM:
            raise od.urllib.error.HTTPError(url, 404, "nf", {}, None)
        return json.dumps(NPM[name])
    if "repo1.maven.org" in url or "plugins.gradle.org" in url:
        base = url.split("/maven2/")[-1] if "maven2" in url else url.split("/m2/")[1]
        key = base.rsplit("/", 1)[0] if "maven2" in url else base.rsplit("/", 2)[0]
        table = MAVEN if "maven2" in url else PLUGINS
        if key not in table:
            raise od.urllib.error.HTTPError(url, 404, "nf", {}, None)
        return "<metadata><versioning><versions>" + "".join(f"<version>{v}</version>" for v in table[key]) + "</versions></versioning></metadata>"
    if "services.gradle.org" in url:
        return json.dumps({"version": "9.9.2"})
    if "pypi.org" in url:
        name = url.split("/pypi/")[1].split("/")[0]
        return json.dumps({"info": {"version": "0.120.0"}, "releases": PYPI[name]})
    raise AssertionError(url)


def project(tmp_path, files):
    for rel, text in files.items():
        p = tmp_path / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
    return {(r["ecosystem"], r["name"]): r for r in od.analyze(tmp_path, od.Lookup(fake), workers=2)}


def test_semver_ranges():
    assert od.satisfies("6.0.3", ">=6.0 <6.1") and not od.satisfies("7.0.1", ">=6.0 <6.1")
    assert od.satisfies("9.4.0", "^8 || ^9") and not od.satisfies("10.0.0", "^8 || ^9")
    assert od.satisfies("0.2.5", "^0.2.1") and not od.satisfies("0.3.0", "^0.2.1")
    assert od.satisfies("1.4.9", "~1.4") and not od.satisfies("1.5.0", "~1.4")
    assert od.satisfies("2.3.0", "1.0.0 - 2.3") and od.satisfies("5.0.0", "*")
    assert od.lag("5.4.0", "6.0.0") == "major" and od.lag("3.0.2", "3.2.1") == "minor" and od.lag("4.2.13", "4.2.21") == "patch"
    assert od.lag("7.2.3.Final", "7.2.3.Final") is None and not od.stable("8.0.0.CR1") and not od.stable("4.0.0-M1") and od.stable("4.2.21.Final")


def test_npm_targets_respect_peers_and_flag_obsolete(tmp_path):
    rows = project(tmp_path, {"package.json": json.dumps({"dependencies": {"@angular/core": "^21.0.0", "primeng": "21.0.2"},
        "devDependencies": {"@angular/compiler-cli": "^21.0.0", "typescript": "~5.9.3", "eslint": "^9.1.0", "eslint-plugin-old": "2.0.0",
                            "local-lib": "file:../lib"}})})
    assert rows[("npm", "@angular/core")]["target"] == "22.1.0"  # the release candidate is not proposed
    assert rows[("npm", "primeng")]["target"] == "22.0.0"
    ts = rows[("npm", "typescript")]
    assert ts["target"] == "6.0.3" and ts["latest"] == "7.0.1" and "@angular/compiler-cli 22.1.0 acepta typescript" in ts["note"]
    es = rows[("npm", "eslint")]  # eslint 10 would leave eslint-plugin-old without a compatible version: eslint stays, flagged obsolete
    assert es["deprecated"] and es["target"] == "9.1.0" and "eslint-plugin-old" in es["note"]
    assert rows[("npm", "eslint-plugin-old")]["target"] == "2.0.0"
    assert ("npm", "local-lib") not in rows  # local paths are not registry packages


def test_maven_gradle_python(tmp_path):
    rows = project(tmp_path, {
        "back/pom.xml": """<project xmlns="http://maven.apache.org/POM/4.0.0"><properties><poi.version>5.4.0</poi.version></properties>
<dependencies><dependency><groupId>org.apache.poi</groupId><artifactId>poi-ooxml</artifactId><version>${poi.version}</version></dependency>
<dependency><groupId>org.hibernate.orm</groupId><artifactId>hibernate-core</artifactId><version>7.2.3.Final</version></dependency>
<dependency><groupId>com.empresa</groupId><artifactId>privada</artifactId><version>1.0.0</version></dependency></dependencies></project>""",
        "svc/build.gradle": "plugins { id 'org.springframework.boot' version '4.0.6' }\n// implementation 'org.apache.poi:poi-ooxml:1.0'\n"
                            "dependencies { implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.2' }\n",
        "svc/gradle/wrapper/gradle-wrapper.properties": "distributionUrl=https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip\n",
        "api/requirements.txt": "fastapi==0.110.0  # web\n"})
    assert rows[("maven", "org.apache.poi:poi-ooxml")]["lag"] == "major"  # ${property} resolved
    assert rows[("maven", "org.hibernate.orm:hibernate-core")]["lag"] is None  # 8.0.0.CR1 is not stable
    assert "privado" in rows[("maven", "com.empresa:privada")]["unresolved"]
    assert rows[("gradle-plugin", "org.springframework.boot")]["target"] == "4.2.0"
    assert rows[("maven", "org.springdoc:springdoc-openapi-starter-webmvc-ui")]["target"] == "3.2.1"
    assert rows[("gradle-wrapper", "gradle")]["lag"] == "minor"
    assert rows[("pypi", "fastapi")]["target"] == "0.120.0"
    assert sum(1 for k in rows if k[1] == "org.apache.poi:poi-ooxml") == 1  # the commented coordinate is ignored


def test_exit_codes_and_verifier(tmp_path):
    rows = list(project(tmp_path, {"requirements.txt": "fastapi==0.120.0\n"}).values())
    assert od.summarize(rows, strict=True)[0] == 0
    behind = [dict(rows[0], current="0.119.9", lag="patch")]
    assert od.summarize(behind, strict=False)[0] == 0 and od.summarize(behind, strict=True)[0] == 1
    assert od.summarize([], strict=False)[0] == 2
    r = checks.dependencies_current(tmp_path, rows=[dict(rows[0], current="0.100.0", lag="minor")])
    assert r.status == checks.NO_CUMPLE and r.method == "network"
    assert checks.dependencies_current(tmp_path, rows=rows).status == checks.CUMPLE
    off = [dict(rows[0], unresolved="URLError: sin red", lag=None)]
    assert checks.dependencies_current(tmp_path, rows=off).status == checks.NO_EVALUADO
