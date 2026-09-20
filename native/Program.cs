using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace AcmToolkit
{
    internal static class Program
    {
        internal const string Stamp = "v11";

        [STAThread]
        private static void Main(string[] args)
        {
            bool selfTest = Array.IndexOf(args, "--selftest") >= 0;
            string baseDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ACMToolkit");
            string wwwDir = Path.Combine(baseDir, "www");
            string binDir = Path.Combine(baseDir, "bin");

            ExtractEmbedded(baseDir, wwwDir, binDir);

            // 让 WebView2Loader.dll 可被找到（单 exe 分发时从解压目录加载）
            string path = Environment.GetEnvironmentVariable("PATH");
            if (path == null || path.IndexOf(binDir, StringComparison.OrdinalIgnoreCase) < 0)
                Environment.SetEnvironmentVariable("PATH", binDir + ";" + path);

            // 托管 SDK 程序集也内嵌在 exe 里，按需从解压目录加载
            AppDomain.CurrentDomain.AssemblyResolve += (s, e) =>
            {
                string name = new System.Reflection.AssemblyName(e.Name).Name;
                if (name == "Microsoft.Web.WebView2.Core" || name == "Microsoft.Web.WebView2.WinForms")
                {
                    string p = Path.Combine(binDir, name + ".dll");
                    if (File.Exists(p)) return System.Reflection.Assembly.LoadFrom(p);
                }
                return null;
            };

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm(wwwDir, baseDir, selfTest));
        }

        private static void ExtractEmbedded(string baseDir, string wwwDir, string binDir)
        {
            string stampFile = Path.Combine(baseDir, ".stamp");
            bool fresh = true;
            try { fresh = File.ReadAllText(stampFile).Trim() != Stamp; } catch { }

            if (fresh)
            {
                try { Directory.Delete(wwwDir, true); } catch { }
            }
            Directory.CreateDirectory(wwwDir);
            Directory.CreateDirectory(binDir);

            var asm = Assembly.GetExecutingAssembly();
            foreach (string res in asm.GetManifestResourceNames())
            {
                string target;
                if (res == "webview2loader") target = Path.Combine(binDir, "WebView2Loader.dll");
                else if (res == "wv2core") target = Path.Combine(binDir, "Microsoft.Web.WebView2.Core.dll");
                else if (res == "wv2winforms") target = Path.Combine(binDir, "Microsoft.Web.WebView2.WinForms.dll");
                else if (res.StartsWith("www/", StringComparison.Ordinal)) target = Path.Combine(wwwDir, res.Substring(4).Replace('/', Path.DirectorySeparatorChar));
                else continue;

                if (!fresh && File.Exists(target)) continue;
                string dir = Path.GetDirectoryName(target);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                using (var s = asm.GetManifestResourceStream(res))
                using (var fs = File.Create(target))
                {
                    if (s == null) throw new IOException("缺失内嵌资源: " + res);
                    s.CopyTo(fs);
                }
            }
            try { File.WriteAllText(stampFile, Stamp); } catch { }
        }
    }

    internal sealed class MainForm : Form
    {
        private readonly WebView2 wv = new WebView2 { Dock = DockStyle.Fill };
        private readonly bool selfTest;
        private readonly string wwwDir;
        private readonly string baseDir;

        public MainForm(string wwwDir, string baseDir, bool selfTest)
        {
            this.wwwDir = wwwDir;
            this.baseDir = baseDir;
            this.selfTest = selfTest;
            Text = "ACM 训练台";
            Width = 1440;
            Height = 920;
            MinimumSize = new System.Drawing.Size(960, 620);
            StartPosition = FormStartPosition.CenterScreen;
            if (selfTest)
            {
                Opacity = 0;
                ShowInTaskbar = false;
            }
            Controls.Add(wv);
            Load += OnLoad;
            FormClosed += (s, e) => Log("form closed");
        }

        private void Log(string msg)
        {
            try
            {
                File.AppendAllText(Path.Combine(baseDir, "applog.txt"),
                    DateTime.Now.ToString("HH:mm:ss.fff") + " " + msg + Environment.NewLine);
            }
            catch { }
        }

        private async void OnLoad(object sender, EventArgs e)
        {
            Log("load begin, selftest=" + selfTest);
            try
            {
                string userData = Path.Combine(baseDir, "webdata");
                var env = await CoreWebView2Environment.CreateAsync(null, userData);
                await wv.EnsureCoreWebView2Async(env);
                Log("webview2 ready");
                wv.CoreWebView2.Settings.IsStatusBarEnabled = false;
                wv.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "acmtoolkit.app", wwwDir, CoreWebView2HostResourceAccessKind.Allow);
                wv.CoreWebView2.NewWindowRequested += OnNewWindowRequested;
                wv.CoreWebView2.NavigationCompleted += OnNavigationCompleted;
                wv.CoreWebView2.Navigate("https://acmtoolkit.app/index.html");
                Log("navigating");
            }
            catch (Exception ex)
            {
                Log("FAIL: " + ex);
                if (selfTest) Application.Exit();
                else
                {
                    MessageBox.Show("启动失败：" + ex.Message, "ACM 训练台", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    Application.Exit();
                }
            }
        }

        private void OnNewWindowRequested(object sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            // 打印视图已改为页面内覆盖层，正常不会走到这里；
            // 兜底：交给系统默认浏览器打开
            e.Handled = true;
            try
            {
                var u = new Uri(e.Uri);
                if (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps)
                    System.Diagnostics.Process.Start(e.Uri);
            }
            catch { }
        }

        private async void OnNavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            Log("nav completed, success=" + e.IsSuccess);
            if (!selfTest || !e.IsSuccess)
            {
                if (!e.IsSuccess) Application.Exit();
                return;
            }
            try
            {
                await Task.Delay(1500); // 等 iframe（技能树）加载
                string js = "(()=>{var r={fsa:typeof showDirectoryPicker==='function',ls:false,idb:false,iframe:'no'};"
                          + "try{localStorage.setItem('_t','1');r.ls=true;}catch(e){}"
                          + "try{r.idb=!!window.indexedDB;}catch(e){}"
                          + "try{var f=document.getElementById('treeFrame');r.iframe=f&&f.contentDocument&&f.contentDocument.getElementById('svg')?'loaded':'empty';}catch(e){r.iframe='err';}"
                          + "return r;})()";
                string result = await wv.CoreWebView2.ExecuteScriptAsync(js);
                Log("checks: " + result);
                File.WriteAllText(Path.Combine(baseDir, "selftest.json"), result);
            }
            catch (Exception ex)
            {
                Log("selftest FAIL: " + ex);
            }
            Application.Exit();
        }
    }
}
