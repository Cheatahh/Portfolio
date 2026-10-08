plugins {
    alias(libs.plugins.kotlinMultiplatform)
}

version = "0.0.1"

kotlin {
    js {
        outputModuleName = "portfolioContent"
        browser()
        binaries.library()
        generateTypeScriptDefinitions()
        compilerOptions {
            target = "es2015"
            optIn.add("kotlin.js.ExperimentalJsExport")
        }
    }
    sourceSets {
        commonMain.dependencies {

        }
        commonTest.dependencies {

        }
    }
}