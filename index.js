#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>
#include <algorithm>
#include <utility>
#include <cctype>
#include <boost/multiprecision/cpp_int.hpp>

using namespace std;
using boost::multiprecision::cpp_int;

// Simple exact rational type: num/den kept reduced (den>0)
struct Rat {
    cpp_int num{0}, den{1}; // invariant: gcd(|num|, den)=1, den>0
    Rat() {}
    Rat(cpp_int n) : num(n), den(1) {}
    Rat(cpp_int n, cpp_int d) { set(n, d); }

    static cpp_int abs_c(const cpp_int& x){ return x < 0 ? -x : x; }

    void normalize() {
        if (den == 0) throw runtime_error("Zero denominator");
        if (den < 0) { den = -den; num = -num; }
        cpp_int g = gcd(abs_c(num), den);
        if (g != 0) { num /= g; den /= g; }
    }
    void set(cpp_int n, cpp_int d) { num = n; den = d; normalize(); }

    static cpp_int gcd(cpp_int a, cpp_int b){
        if (a < 0) { a = -a; }
        if (b < 0) { b = -b; }
        while (b != 0){ cpp_int t=a%b; a=b; b=t; }
        return a;
    }

    // ops
    Rat operator+(const Rat& o) const { return Rat(num*o.den + o.num*den, den*o.den); }
    Rat operator-(const Rat& o) const { return Rat(num*o.den - o.num*den, den*o.den); }
    Rat operator*(const Rat& o) const { return Rat(num*o.num, den*o.den); }
    Rat operator/(const Rat& o) const { return Rat(num*o.den, den*o.num); }
    Rat& operator+=(const Rat& o){ *this = *this + o; return *this; }
    Rat& operator-=(const Rat& o){ *this = *this - o; return *this; }
};

static int charVal(char c){
    if ('0'<=c && c<='9') return c-'0';
    if ('a'<=c && c<='z') return c-'a'+10;
    if ('A'<=c && c<='Z') return c-'A'+10;
    return -1;
}

static cpp_int base_to_int(const string& s, int base){
    cpp_int v = 0;
    for(char c: s){
        int d = charVal(c);
        if (d < 0 || d >= base) throw runtime_error("Bad digit");
        v = v * base + d;
    }
    return v;
}

// Newton divided differences → coefficients c0..cm (exact)
static vector<Rat> newton_coefficients(vector<pair<cpp_int, cpp_int>> pts){
    sort(pts.begin(), pts.end(), [](auto& a, auto& b){ return a.first < b.first; });
    int n = (int)pts.size();
    vector<Rat> xs(n), coef(n);
    for(int i=0;i<n;i++){ xs[i] = Rat(pts[i].first); coef[i] = Rat(pts[i].second); }
    for(int j=1;j<n;j++){
        for(int i=n-1;i>=j;i--){
            Rat num = coef[i] - coef[i-1];
            Rat den = xs[i] - xs[i-j];
            coef[i] = num / den;
        }
    }
    vector<Rat> c(n);
    for(int i=0;i<n;i++) c[i] = coef[i];
    return c;
}

// Convert Newton → power basis
static vector<Rat> expand_newton_to_power(const vector<Rat>& xs_sorted, const vector<Rat>& c){
    int m = (int)c.size()-1;
    vector<Rat> poly; // a0..am
    poly.push_back(c[m]);
    for(int k=m-1;k>=0;k--){
        vector<Rat> next_poly(poly.size() + 1, Rat(0));
        // multiply by x
        for(size_t i = 0; i < poly.size(); ++i) {
            next_poly[i+1] += poly[i];
        }
        // multiply by -xs[k]
        for(size_t i = 0; i < poly.size(); ++i) {
            next_poly[i] -= xs_sorted[k] * poly[i];
        }
        // add c[k]
        next_poly[0] += c[k];
        poly = next_poly;
    }
    return poly;
}

static Rat eval_power(const vector<Rat>& poly, const cpp_int& x){
    Rat v(0);
    for(int i=(int)poly.size()-1;i>=0;i--){
        v = v * Rat(x) + poly[i];
    }
    return v;
}

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Read full JSON from stdin
    string js((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());

    // Extract k
    size_t posk = js.find("\"k\"");
    if (posk == string::npos) { cerr << "No k\n"; return 1; }
    size_t col = js.find(':', posk);
    size_t endnum = js.find_first_of(",}", col+1);
    int k = stoi(js.substr(col+1, endnum-col-1));

    // Collect all "x": {"base":"B","value":"V"}
    vector<pair<cpp_int, cpp_int>> points;
    size_t pos = 0;
    while (true){
        size_t q1 = js.find('"', pos);
        if (q1 == string::npos) break;
        size_t q2 = js.find('"', q1+1);
        if (q2 == string::npos) break;
        string key = js.substr(q1+1, q2-q1-1);
        pos = q2+1;
        
        if (key == "keys") continue;
        
        size_t colon = js.find(':', pos);
        if (colon == string::npos) break;
        
        size_t bpos = js.find("\"base\"", colon);
        if (bpos == string::npos) break;
        size_t bcol = js.find(':', bpos);
        size_t bq1 = js.find('"', bcol);
        size_t bq2 = js.find('"', bq1+1);
        string bstr = js.substr(bq1+1, bq2-bq1-1);
        int base = stoi(bstr);

        size_t vpos = js.find("\"value\"", bq2);
        size_t vcol = js.find(':', vpos);
        size_t vq1 = js.find('"', vcol);
        size_t vq2 = js.find('"', vq1+1);
        string vstr = js.substr(vq1+1, vq2-vq1-1);

        cpp_int x;
        try {
            x = cpp_int(stoll(key));
        } catch (const std::invalid_argument& e) {
            // This key is not a number (e.g., "n", "k", "base"), so skip it.
            continue;
        }

        cpp_int y = base_to_int(vstr, base);
        points.emplace_back(x, y);
        pos = vq2+1;
    }

    if ((int)points.size() < k){
        cerr << "Not enough points for degree m=k-1.\n";
        return 1;
    }

    sort(points.begin(), points.end(), [](auto&a, auto&b){ return a.first < b.first; });
    vector<pair<cpp_int, cpp_int>> pts_k(points.begin(), points.begin()+k);

    vector<Rat> c = newton_coefficients(pts_k);
    vector<Rat> xs_sorted;
    for(auto &p: pts_k) xs_sorted.emplace_back(p.first);
    vector<Rat> power = expand_newton_to_power(xs_sorted, c);

    cout << "degree: " << (k-1) << "\n";
    cout << "coefficients a0..am:\n";
    for (size_t i=0;i<power.size();++i){
        const Rat& a = power[i];
        if (a.den == 1) cout << a.num;
        else cout << a.num << "/" << a.den;
        if (i+1 < power.size()) cout << " ";
    }
    cout << "\n";

    bool ok = true;
    for (auto &p : points){
        Rat val = eval_power(power, p.first);
        Rat rhs(p.second);
        if (!(val.num * rhs.den == rhs.num * val.den)) { ok = false; break; }
    }
    cout << "fits_all_points: " << (ok ? "true" : "false") << "\n";
    return 0;
}
