plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.akitda.admin"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.akitda.admin"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        // Live backend (Hostinger VPS)
        buildConfigField("String", "BASE_URL", "\"https://akitdaekm.com\"")
    }

    signingConfigs {
        create("release") {
            val ks = rootProject.file("../play-store-assets/keystore/akitda-release.jks")
            if (ks.exists()) {
                storeFile = ks
                storePassword = System.getenv("AKITDA_KEYSTORE_PASS") ?: "AkitdaEkm@2026"
                keyAlias = "akitda"
                keyPassword = System.getenv("AKITDA_KEY_PASS") ?: "AkitdaEkm@2026"
            }
        }
    }

    buildTypes {
        release {
            val ks = rootProject.file("../play-store-assets/keystore/akitda-release.jks")
            if (ks.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
