import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.ksp)
    id("scoremap.android")
}

android {
    namespace = "scoremap.data.local"
    compileSdk { version = release(37) { minorApiLevel = 1 } }
    buildToolsVersion = "36.0.0"

    defaultConfig { minSdk = 26 }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Instrumented tests for the adapter live in :app, which owns the pinned managed device.
androidComponents {
    beforeVariants { variant -> variant.androidTest.enable = false }
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        jvmTarget = JvmTarget.JVM_17
        allWarningsAsErrors = true
    }
}

dependencies {
    api(project(":library"))
    implementation(libs.androidx.room.runtime)
    ksp(libs.androidx.room.compiler)
}
