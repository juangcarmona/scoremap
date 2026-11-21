plugins { id("com.android.application"); id("org.jetbrains.kotlin.plugin.compose") }
android {
 namespace="com.scoremap.planning92"
 compileSdk { version=release(37) { minorApiLevel=1 } }
 buildToolsVersion="36.0.0"
 defaultConfig { applicationId="com.scoremap.planning92"; minSdk=26; targetSdk=37; versionCode=1; versionName="planning-only" }
 buildFeatures { compose=true }
 compileOptions { sourceCompatibility=JavaVersion.VERSION_17; targetCompatibility=JavaVersion.VERSION_17 }
}
dependencies {
 implementation("androidx.activity:activity-compose:1.13.0")
 implementation(platform("androidx.compose:compose-bom:2026.11.01"))
 implementation("androidx.compose.ui:ui")
 implementation("androidx.compose.material3:material3")
}
