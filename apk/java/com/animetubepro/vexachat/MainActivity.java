package com.animetubepro.vexachat;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.util.ArrayList;

/**
 * VEXA-Chat v4.4.1 — WebView wrapper (site: https://animetubepro.github.io/vexa-chat/)
 *
 * ⚡NAYA v4.4.1:
 * 1. Google/LinkedIn OAuth → CHROME me kholte hain (WebView me Google block karta hai).
 *    Chrome me consent ke baad site intent://oauth se AUTO app me wapas aati hai
 *    (vexachat://oauth?tok=..) aur site VxaApp._appDeliver() se Drive CONNECT karta hai.
 * 2. VexaBridge JS interface — site ki notifications ANDROID system notification banti hain
 *    (channel vexa_chat_default), site se VexaBridge.notify(title, body, type).
 * 3. Saari 24 permissions + runtime requests (jaise pehle).
 *
 * NOTE: anonymous inner classes NAHI (named static classes) — build-tools 34 d8
 * EnclosingMethod NPE bug bypass ke liye.
 */
public class MainActivity extends Activity {

    public static final String SITE_URL = "https://animetubepro.github.io/vexa-chat/";
    public static final String CHANNEL_ID = "vexa_chat_default";
    private static final int RC_PERMS = 101;
    private static final int RC_FILE_CHOOSER = 102;

    /* OAuth wale hosts — WebView me Google block karta hai, Chrome me kholo */
    private static final String[] OAUTH_HOSTS = {
            "accounts.google.com", "accounts.youtube.com",
            "linkedin.com", "www.linkedin.com"
    };

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private int notifId = 2000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManagerHelper.KEEP_SCREEN_ON());

        makeNotifChannel();
        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroupHelper.MATCH_PARENT(), ViewGroupHelper.MATCH_PARENT()));
        setContentView(webView);

        setupWebView();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
            handleAppIntent(getIntent());
        } else {
            String url = siteUrlFromIntent(getIntent(), SITE_URL);
            webView.loadUrl(url);
        }
        askRuntimePerms();
    }

    /* ══ WebView setup ══ */
    private void setupWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        try {
            s.setUserAgentString(s.getUserAgentString() + " VEXA-Chat/4.4.1 Android");
        } catch (Throwable t) { /* UA tweak optional */ }
        webView.setBackgroundColor(Color.parseColor("#050208"));
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new MyWVClient());
        webView.setWebChromeClient(new MyChrome(this));
        webView.setDownloadListener(new MyDL(this));

        /* ⚡JS BRIDGE: site → Android (notifications + external links) */
        webView.addJavascriptInterface(new VexaBridge(this), "VexaBridge");
    }

    /* ══ intent → site URL (vexachat://oauth + https deep links) ══ */
    private String siteUrlFromIntent(Intent in, String fallback) {
        if (in == null || in.getData() == null) return fallback;
        Uri u = in.getData();
        if ("vexachat".equals(u.getScheme())) return fallback; /* handleAppIntent sambhalega */
        return u.toString(); /* https deep link */
    }

    /* ⚡vexachat://oauth (Chrome se wapas) → site ko token hash ke sath load karo */
    private void handleAppIntent(Intent in) {
        if (in == null || webView == null) return;
        String tok = in.getStringExtra("tok");
        String exp = in.getStringExtra("exp");
        String back = in.getStringExtra("back");
        Uri data = in.getData();
        if (data != null && "vexachat".equals(data.getScheme())) {
            String q = data.getQueryParameter("tok");
            if (q != null) tok = q;
            String qe = data.getQueryParameter("exp");
            if (qe != null) exp = qe;
            String qb = data.getQueryParameter("back");
            if (qb != null) back = qb;
        }
        if (tok == null || tok.length() == 0) return;
        String url = SITE_URL + "#vxaAppTok=" + Uri.encode(tok);
        if (exp != null && exp.length() > 0) url += "&vxaAppExp=" + Uri.encode(exp);
        if (back != null && back.length() > 0) url += "&vxaAppBack=" + Uri.encode(back);
        webView.loadUrl(url);
        toast("✅ Google login wapas app me aa gaya");
    }

    private void toast(String m) {
        try { Toast.makeText(this, m, Toast.LENGTH_SHORT).show(); } catch (Throwable t) {}
    }

    /* ══ runtime permissions ══ */
    private boolean has(String p) {
        return Build.VERSION.SDK_INT < 23
                || checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED;
    }

    private void askRuntimePerms() {
        if (Build.VERSION.SDK_INT < 23) return;
        ArrayList<String> need = new ArrayList<String>();
        need.add(Manifest.permission.CAMERA);
        need.add(Manifest.permission.RECORD_AUDIO);
        need.add(Manifest.permission.ACCESS_FINE_LOCATION);
        need.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        if (Build.VERSION.SDK_INT >= 33) need.add("android.permission.POST_NOTIFICATIONS");
        if (Build.VERSION.SDK_INT >= 31) need.add(Manifest.permission.BLUETOOTH_CONNECT);
        ArrayList<String> ask = new ArrayList<String>();
        for (String p : need) if (!has(p)) ask.add(p);
        if (!ask.isEmpty()) requestPermissions(ask.toArray(new String[0]), RC_PERMS);
    }

    @Override
    public void onRequestPermissionsResult(int rc, String[] perms, int[] res) {
        super.onRequestPermissionsResult(rc, perms, res);
        /* grants ke baad geolocation/camera prompt site ke callback se handle hota hai */
    }

    /* ══ file chooser result ══ */
    @Override
    protected void onActivityResult(int rc, int resCode, Intent data) {
        super.onActivityResult(rc, resCode, data);
        if (rc != RC_FILE_CHOOSER || filePathCallback == null) return;
        Uri[] out = null;
        if (resCode == Activity.RESULT_OK && data != null && data.getData() != null) {
            out = new Uri[]{data.getData()};
        }
        filePathCallback.onReceiveValue(out);
        filePathCallback = null;
    }

    /* ══ notification channel (POST_NOTIFICATIONS ke liye) ══ */
    private void makeNotifChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "VEXA-Chat Notifications",
                NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Messages, calls, follows aur security alerts");
        ch.enableVibration(true);
        ch.enableLights(true);
        nm.createNotificationChannel(ch);
    }

    /* ══ back button — webview history ══ */
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (webView != null) webView.saveState(out);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleAppIntent(intent);
        if (intent != null && intent.getData() != null && webView != null
                && !"vexachat".equals(intent.getData().getScheme())) {
            webView.loadUrl(intent.getData().toString());
        }
    }

    /* ══════ named inner classes (anonymous NAHI — d8 toolchain compat) ══════ */

    /* ⚡v4.4.1: OAuth hosts → CHROME/external browser; baaki sab app ke andar */
    private static final class MyWVClient extends WebViewClient {
        private static boolean isOAuthHost(String host) {
            if (host == null) return false;
            String h = host.toLowerCase();
            for (int i = 0; i < OAUTH_HOSTS.length; i++) {
                if (h.equals(OAUTH_HOSTS[i]) || h.endsWith("." + OAUTH_HOSTS[i])) return true;
            }
            return false;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            String sch = u.getScheme() == null ? "" : u.getScheme();
            if (sch.equals("http") || sch.equals("https")) {
                if (isOAuthHost(u.getHost())) {
                    /* 🌐 Chrome me kholo — wapas intent://oauth se app auto aa jayega */
                    try {
                        Intent i = new Intent(Intent.ACTION_VIEW, u);
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        view.getContext().startActivity(i);
                    } catch (Throwable t) { /* browser nahi — webview me hi try */ }
                    return true;
                }
                return false; /* app ke andar hi */
            }
            if (sch.equals("vexachat")) {
                /* site ne khud vexachat:// link diya — app ke andar handle */
                try {
                    Intent i = new Intent(Intent.ACTION_VIEW, u);
                    i.setPackage(view.getContext().getPackageName());
                    view.getContext().startActivity(i);
                } catch (Throwable t) { /* ignore */ }
                return true;
            }
            try {
                view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, u));
            } catch (Throwable t) { /* tel:, mailto:, intent: … bahar */ }
            return true;
        }
    }

    /* geolocation + camera/mic grant + file chooser */
    private static final class MyChrome extends WebChromeClient {
        private final Activity act;
        MyChrome(Activity a) { this.act = a; }

        /* 📍 Local scan — geolocation prompt + site ko grant */
        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
            PackageManager pm = act.getPackageManager();
            boolean ok = pm.checkPermission(Manifest.permission.ACCESS_FINE_LOCATION,
                    act.getPackageName()) == PackageManager.PERMISSION_GRANTED
                    || pm.checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION,
                    act.getPackageName()) == PackageManager.PERMISSION_GRANTED;
            if (!ok) act.requestPermissions(
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, RC_PERMS + 1);
            cb.invoke(origin, ok, false);
        }

        /* 🎥 Voice/Video calls — camera + mic grant */
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            ArrayList<String> need = new ArrayList<String>();
            String[] res = request.getResources();
            PackageManager pm = act.getPackageManager();
            for (int i = 0; i < res.length; i++) {
                String r = res[i];
                if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)
                        && pm.checkPermission(Manifest.permission.CAMERA,
                        act.getPackageName()) != PackageManager.PERMISSION_GRANTED) {
                    need.add(Manifest.permission.CAMERA);
                }
                if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)
                        && pm.checkPermission(Manifest.permission.RECORD_AUDIO,
                        act.getPackageName()) != PackageManager.PERMISSION_GRANTED) {
                    need.add(Manifest.permission.RECORD_AUDIO);
                }
            }
            if (!need.isEmpty()) {
                act.requestPermissions(need.toArray(new String[0]), RC_PERMS + 3);
            }
            request.grant(request.getResources());
        }

        /* 📎 File attach — webview file chooser */
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
            MainActivity m = (MainActivity) act;
            if (m.filePathCallback != null) m.filePathCallback.onReceiveValue(null);
            m.filePathCallback = cb;
            try {
                Intent i = params.createIntent();
                i.addCategory(Intent.CATEGORY_OPENABLE);
                act.startActivityForResult(Intent.createChooser(i, "File chuno"), RC_FILE_CHOOSER);
            } catch (Throwable t) {
                m.filePathCallback = null;
                Toast.makeText(act, "File picker open nahi hua", Toast.LENGTH_SHORT).show();
                return false;
            }
            return true;
        }
    }

    /* ⬇️ Downloads — DownloadManager se */
    private static final class MyDL implements DownloadListener {
        private final Activity act;
        MyDL(Activity a) { this.act = a; }

        @Override
        public void onDownloadStart(String url, String ua, String cd, String mime, long len) {
            try {
                DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                String name = Uri.parse(url).getLastPathSegment();
                if (name == null || name.length() == 0) name = "vexa-download";
                if (cd != null) {
                    int i = cd.indexOf("filename=");
                    if (i > -1) name = cd.substring(i + 9).replace("\"", "").split(";")[0].trim();
                }
                r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                if (ua != null) r.addRequestHeader("User-Agent", ua);
                String ck = CookieManager.getInstance().getCookie(url);
                if (ck != null) r.addRequestHeader("Cookie", ck);
                DownloadManager dm = (DownloadManager) act.getSystemService(Context.DOWNLOAD_SERVICE);
                if (dm != null) {
                    dm.enqueue(r);
                    Toast.makeText(act, "⬇️ Download start: " + name, Toast.LENGTH_SHORT).show();
                }
            } catch (Throwable t) {
                try { act.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Throwable ig) {}
            }
        }
    }

    /* ══════ ⚡VexaBridge — site JS se Android (addJavascriptInterface "VexaBridge") ══════
       Site side (script.js): naye notifs child_added par VexaBridge.notify() call hota hai
       → ANDROID system notification (vexa_chat_default channel, heads-up, click → app) */
    private static final class VexaBridge {
        private final Activity act;
        VexaBridge(Activity a) { this.act = a; }

        @android.webkit.JavascriptInterface
        public void notify(String title, String body, String type) {
            try {
                MainActivity m = (MainActivity) act;
                m.postSystemNotification(title == null ? "VEXA-Chat" : title,
                        body == null ? "" : body,
                        type == null ? "" : type);
            } catch (Throwable t) { /* bridge fail — site chalta rahega */ }
        }

        @android.webkit.JavascriptInterface
        public void openUrl(String url) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                act.startActivity(i);
            } catch (Throwable t) { /* ignore */ }
        }

        @android.webkit.JavascriptInterface
        public boolean isApp() { return true; }

        @android.webkit.JavascriptInterface
        public String appVersion() { return "4.4.1"; }

        @android.webkit.JavascriptInterface
        public void toast(String msg) {
            try {
                Toast.makeText(act, msg == null ? "" : msg, Toast.LENGTH_SHORT).show();
            } catch (Throwable t) {}
        }
    }

    /* Android system notification post (site notifications ke liye) */
    private void postSystemNotification(String title, String body, String type) {
        try {
            if (Build.VERSION.SDK_INT >= 33
                    && checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                    != PackageManager.PERMISSION_GRANTED) return; /* permission nahi — chup */
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= 26) {
                b = new Notification.Builder(this, CHANNEL_ID);
            } else {
                b = new Notification.Builder(this);
                b.setPriority(Notification.PRIORITY_HIGH);
            }
            b.setSmallIcon(R.mipmap.ic_launcher)
             .setContentTitle(title)
             .setStyle(new Notification.BigTextStyle().bigText(body))
             .setAutoCancel(true)
             .setOnlyAlertOnce(false);
            if (body != null && body.length() > 0) b.setContentText(body);
            if (Build.VERSION.SDK_INT >= 21) {
                b.setColor(Color.parseColor("#8b5cf6"));
            }
            PendingIntent pi = PendingIntent.getActivity(this, notifId,
                    new Intent(this, MainActivity.class),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            b.setContentIntent(pi);
            nm.notify(notifId++, b.build());
        } catch (Throwable t) { /* notification fail — app chalta rahega */ }
    }
}

/* chhota helper — WindowManager/ViewGroup constants ek jagah (d8-safe) */
class WindowManagerHelper {
    static int KEEP_SCREEN_ON() { return android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON; }
}

class ViewGroupHelper {
    static int MATCH_PARENT() { return android.view.ViewGroup.LayoutParams.MATCH_PARENT; }
}
