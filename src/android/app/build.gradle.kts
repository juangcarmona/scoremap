import com.android.build.api.dsl.ManagedVirtualDevice
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    id("scoremap.android")
}

android {
    namespace = "scoremap.android"
    compileSdk { version = release(37) { minorApiLevel = 1 } }
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = providers.environmentVariable("SCOREMAP_APPLICATION_ID").getOrElse("scoremap.android")
        minSdk = 26
        targetSdk = 37
        versionCode = providers.environmentVariable("SCOREMAP_VERSION_CODE").getOrElse("1").toInt()
        versionName = providers.environmentVariable("SCOREMAP_VERSION_NAME").getOrElse("0.1.0")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    val uploadKeystore = providers.environmentVariable("ANDROID_KEYSTORE_PATH").orNull
    signingConfigs {
        if (uploadKeystore != null) {
            create("upload") {
                storeFile = file(uploadKeystore)
                storePassword = providers.environmentVariable("ANDROID_KEYSTORE_PASSWORD").get()
                keyAlias = providers.environmentVariable("ANDROID_KEY_ALIAS").get()
                keyPassword = providers.environmentVariable("ANDROID_KEY_PASSWORD").get()
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (uploadKeystore != null) signingConfig = signingConfigs.getByName("upload")
        }
    }

    sourceSets
        .getByName("androidTest")
        .assets.directories
        .add("../data/local/schemas")

    testOptions {
        managedDevices {
            localDevices.create("pixelTabletApi37") {
                device = "Pixel Tablet"
                apiLevel = 37
                systemImageSource = "aosp"
                require64Bit = true
                testedAbi = "x86_64"
                pageAlignment = ManagedVirtualDevice.PageAlignment.FORCE_4KB_PAGES
            }
        }
    }

    buildFeatures { compose = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        jvmTarget = JvmTarget.JVM_17
        allWarningsAsErrors = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(project(":feature:library"))
    implementation(project(":data:local"))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.core)
    androidTestImplementation(libs.androidx.compose.ui.test.junit)
    // Synthetic test-only database; no product persistence is introduced by the shell.
    androidTestImplementation(project(":data:local"))
    androidTestImplementation(libs.androidx.room.runtime)
    add("kspAndroidTest", libs.androidx.room.compiler)
}
