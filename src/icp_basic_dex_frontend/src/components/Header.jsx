import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { canisterId as IICanisterID } from "../../../declarations/internet_identity_div";

export const Header = (props) => {
    const {
        updateOrderList,
        updateUserTokens,
        setAgent,
        setUserPrincipal,
    } = props;

    // トグルスイッチの情報を管理するstate変数
    const [isDarkMode, setIsDarkMode] = useState(false);

    // トグルスイッチが変更されたときにコールされるメソッド
    const handleToggle = () => {
        setIsDarkMode(!isDarkMode);
        // ダークモードの設定をローカルストレージに保存する
        localStorage.setItem("isDarkMode", !isDarkMode);
    };

    const handleSuccess = async (authClient) => {
        // 認証したユーザのidentity取得
        const identity = await authClient.getIdentity();

        // 認証したユーザのprincipalを取得
        const principal = identity.getPrincipal();
        // setUserPrincipal(principal);

        console.log(`User Principal: ${principal.toString()}`);

        // 取得した`identity`を使用してICと対話する`agent`を作成
        const newAgent = new HttpAgent({ identity });
        if (process.env.DFX_NETWORK === "local"){
            newAgent.fetchRootKey();
        }

        // 認証したユーザが保有するトークンのデータを取得
        updateUserTokens(principal);
        // オーダー一覧を取得
        updateOrderList();

        // ユーザのデータを保存
        setUserPrincipal(principal);
        setAgent(newAgent);
    };

    const handleLogin = async () => {
        // アプリケーションが接続しているネットワークに応じて
        // ユーザ認証に使用するIIのURLを決定する
        let iiUrl;
        if (process.env.DFX_NETWORK === "local") {
            iiUrl = `http://localhost:4943/?canisterId=${IICanisterID}`;
          } else if (process.env.DFX_NETWORK === "ic") {
            iiUrl = "https://identity.ic0.app/#authorize";
          } else {
            iiUrl = `https://${IICanisterID}.dfinity.network`;
          }
        // ログイン認証を実行
        const authClient = await AuthClient.create();
        authClient.login({
            identityProvider: iiUrl,
            onSuccess: async () => {
              handleSuccess(authClient);
            },
            onError: (error) => {
              console.error(`Login Failed: , ${error}`);
            },
          });
        };

    // ページ読み込み時に、保存されたダークモードの設定を取得する
    useEffect(() => {
        const isDarkModeInLocalStorage = localStorage.getItem("isDarkMode");
        if (isDarkModeInLocalStorage) {
            setIsDarkMode(JSON.parse(isDarkModeInLocalStorage));
        }
    }, []);
    
    // body要素のCSSクラスを変更する
    useEffect(() => {
        const body = document.querySelector("body");
        if (isDarkMode) {
        body.classList.add("dark-mode");
        } else {
        body.classList.remove("dark-mode");
        }
    }, [isDarkMode]);
    
    return (
        <ul>
            <li>Simple DEX</li>
            <li>
            <label>
                <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={handleToggle}
                />
                Toggle Dark Mode
            </label>
            </li>
            <li className="btn-login">
                <button onClick={handleLogin}>Login Internet Identity</button>
            </li>
        </ul>
        
    );
};
