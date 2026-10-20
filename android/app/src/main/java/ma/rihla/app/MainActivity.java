package ma.rihla.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Bord à bord sur TOUTES les versions, pas seulement là où Android 15+ l'impose (targetSdk 35+) :
        // le greffon SystemBars de Capacitor transmet alors les zones sûres à la WebView de la même
        // façon partout (env(safe-area-inset-*), la page déclarant viewport-fit=cover), et la CSS de
        // Rihla — déjà écrite pour l'île dynamique d'iOS (.voile-etat) — s'en charge.
        // ⚠ APRÈS super.onCreate : BridgeActivity y remplace le thème de lancement par
        // AppTheme.NoActionBar avant de créer la fenêtre ; toucher la fenêtre plus tôt la figerait
        // avec le thème de lancement.
        EdgeToEdge.enable(this);

        // Le bouton Retour d'Android remonte l'HISTORIQUE de la page. Capacitor 8 ne s'en charge plus
        // (c'était le rôle de @capacitor/app, qu'on n'ajoute pas : il toucherait aussi le paquet iOS) ;
        // sans ceci l'activité se ferme à chaque Retour, même au fond d'une étape. Or l'application
        // pose elle-même une entrée d'historique par écran ouvert (src/App.jsx, « ecrans » / popstate) :
        // Retour la reprend, l'écran du dessus se ferme, et c'est seulement depuis l'accueil — plus
        // aucune entrée à reprendre — que Retour quitte l'application, comme partout sur Android.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView vue = getBridge() != null ? getBridge().getWebView() : null;
                if (vue != null && vue.canGoBack()) {
                    vue.goBack();
                } else {
                    // Rien à remonter : on rend la main au comportement par défaut (quitter).
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }
}
