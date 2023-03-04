import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";

import T "types";

module {
    public class BalanceBook() {

        // ユーザーとトークンの種類・量をマッピング
        var balance_book = HashMap.HashMap<Principal, HashMap.HashMap<T.Token, Nat>>(10, Principal.equal, Principal.hash);

        // ユーザと預け入れたトークンデータを追加
        // postupgradeを実行する際に使用される
        public func put(user : Principal, userBalances : HashMap.HashMap<T.Token, Nat>) {
            balance_book.put(user, userBalances);
        };

        // ユーザーPrincipalとトークンデータのイテレータを返す
        // postupgradeを実行する際に使用される
        public func entries() : Iter.Iter<(Principal, HashMap.HashMap<T.Token, Nat>)> {
            balance_book.entries();
        };

        // 保存されているデータ量を返す
        // postupgradeを実行する際に使用される
        public func size() : Nat {
            balance_book.size();
        };

        // ユーザーに紐づいたトークンと残高を取得
        public func get(user : Principal) : ?HashMap.HashMap<T.Token, Nat> {
            return balance_book.get(user);
        };

        // ユーザーの預け入れを記録する
        public func addToken(user : Principal, token : T.Token, amount : Nat) {
            // ユーザーのデータがあるかどうか
            switch (balance_book.get(user)) {
                case null {
                    var new_data = HashMap.HashMap<Principal, Nat>(2, Principal.equal, Principal.hash);
                    new_data.put(token, amount);
                    balance_book.put(user, new_data);
                };
                case (?token_balance) {
                    // トークンが記録されているかどうか
                    switch (token_balance.get(token)) {
                        case null {
                            token_balance.put(token, amount);
                        };
                        case (?balance) {
                            token_balance.put(token, balance + amount);
                        };
                    };
                };
            };
        };

        // DEXからトークンを引き出す際にコールされる
        // トークンがあれば更新された残高を返し、なければ`null`を返す
        public func removeToken(user : Principal, token : T.Token, amount : Nat) : ?Nat {
            // ユーザーのデータがあるかどうか
            switch (balance_book.get(user)) {
                case null return (null);
                case (?token_balance) {
                    // トークンが記録されているかどうか
                    switch (token_balance.get(token)) {
                        case null return (null);
                        case (?balance) {
                            if (balance < amount) return (null);

                            // 残高と引き出す量が等しい時はトークンのデータごと削除
                            if (balance == amount) {
                                token_balance.delete(token);
                                // 残高の方が多い時は差し引いた分を再度保存
                            } else {
                                token_balance.put(token, balance - amount);
                            };
                            return ?(balance - amount);
                        };
                    };
                };
            };
        };

        // ユーザーが`balance_book`内に`amount`分のトークンを保有しているかを確認する
        public func hasEnoughBalance(user : Principal, token : T.Token, amount : Nat) : Bool {
            // ユーザーデータがあるかどうか
            switch (balance_book.get(user)) {
                case null return (false);
                case (?token_balance) {
                    // トークンが記録されているかどうか
                    switch (token_balance.get(token)) {
                        case null return (false);
                        case (?balance) {
                            // `amount`以上残高ありで`true`、なしで`false`を返す
                            return (balance >= amount);
                        };
                    };
                };
            };
        };
    };
};
