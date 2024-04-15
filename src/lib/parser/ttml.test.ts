/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { TTMLParser } from './ttml';

describe('TTMLParser', () => {
  let parser: TTMLParser;

  beforeEach(() => {
    parser = new TTMLParser();
  });

  it('should parse syllable TTML document', () => {
    const xml = new DOMParser().parseFromString(
      `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xml:lang="ja"><head><metadata><ttm:agent type="person" xml:id="v1"/></metadata></head><body dur="3:33.987"><div begin="16.659" end="41.120"><p begin="16.659" end="22.616" ttm:agent="v1"><span begin="16.659" end="17.259">袋</span><span begin="17.259" end="17.526">に</span><span begin="17.526" end="17.926">詰め</span><span begin="17.926" end="18.192">ら</span><span begin="18.192" end="18.542">れ</span><span begin="18.542" end="18.926">た</span><span begin="18.926" end="19.342">ナッ</span><span begin="19.342" end="19.526">ツ</span><span begin="19.526" end="19.726">の</span><span begin="19.726" end="20.075">よう</span><span begin="20.075" end="20.594">な</span><span begin="20.875" end="21.294">世</span><span begin="21.294" end="21.910">間</span><span begin="21.910" end="22.094">で</span><span begin="22.094" end="22.616">は</span></p><p begin="22.687" end="29.292" ttm:agent="v1"><span begin="22.687" end="23.487">誰</span><span begin="23.487" end="23.719">も</span><span begin="23.719" end="24.154">が</span><span begin="24.154" end="24.504">それ</span><span begin="24.504" end="24.967">ぞ</span><span begin="24.967" end="25.154">れ</span><span begin="25.154" end="25.706">出会っ</span><span begin="25.706" end="25.932">た</span><span begin="25.932" end="26.733">誰</span><span begin="26.733" end="26.986">か</span><span begin="26.986" end="27.530">と</span><span begin="27.530" end="28.386">寄り添い</span><span begin="28.386" end="28.719">合っ</span><span begin="28.719" end="28.903">て</span><span begin="28.903" end="29.292">る</span></p><p begin="29.374" end="35.387" ttm:agent="v1"><span begin="29.374" end="30.051">そこに</span><span begin="30.051" end="30.487">紛</span><span begin="30.487" end="30.670">れ</span><span begin="30.670" end="30.953">込</span><span begin="30.953" end="31.353">ん</span><span begin="31.353" end="31.702">だ</span><span begin="31.702" end="32.102">僕</span><span begin="32.102" end="32.486">らは</span><span begin="32.486" end="32.886">ピー</span><span begin="32.886" end="33.110">ナッ</span><span begin="33.110" end="33.493">ツ</span><span begin="33.737" end="34.153">み</span><span begin="34.153" end="34.702">た</span><span begin="34.702" end="34.870">い</span><span begin="34.870" end="35.387">に</span></p><p begin="35.469" end="41.120" ttm:agent="v1"><span begin="35.469" end="35.695">木</span><span begin="35.695" end="36.346">の</span><span begin="36.346" end="36.546">実</span><span begin="36.546" end="36.730">の</span><span begin="36.730" end="37.162">フリ</span><span begin="37.162" end="37.346">し</span><span begin="37.346" end="37.930">な</span><span begin="37.930" end="38.146">が</span><span begin="38.146" end="38.530">ら</span> <span begin="38.762" end="39.362">微</span><span begin="39.362" end="39.530">笑</span><span begin="39.530" end="39.962">み</span><span begin="39.962" end="40.578">浮かべ</span><span begin="40.578" end="41.120">る</span></p></div><div begin="41.192" end="57.107"><p begin="41.192" end="47.346" ttm:agent="v1"><span begin="41.192" end="41.891">幸</span><span begin="41.891" end="42.141">せ</span><span begin="42.141" end="42.491">の</span><span begin="42.491" end="42.789">テン</span><span begin="42.789" end="43.123">プレー</span><span begin="43.123" end="43.617">トの</span><span begin="43.617" end="43.991">上</span> <span begin="44.141" end="44.456">文字</span><span begin="44.456" end="44.773">通</span><span begin="44.773" end="44.989">り</span><span begin="44.989" end="45.657">絵に描</span><span begin="45.657" end="45.989">いた</span><span begin="45.989" end="46.510">うわべ</span><span begin="46.510" end="46.741">の</span><span begin="46.741" end="47.346">裏</span></p><p begin="47.589" end="57.107" ttm:agent="v1"><span begin="47.589" end="48.111">テー</span><span begin="48.111" end="48.495">ブル</span><span begin="48.495" end="48.911">を</span><span begin="48.911" end="49.245">囲</span><span begin="49.245" end="49.578">み</span><span begin="49.578" end="49.962">手を</span><span begin="49.962" end="50.364">合わす</span><span begin="50.495" end="50.895">その</span><span begin="50.895" end="51.346">時</span><span begin="51.346" end="51.778">さえ</span> <span begin="51.879" end="52.495">ありの</span><span begin="52.495" end="53.407">ままでは</span><span begin="53.407" end="53.775">居</span><span begin="53.775" end="54.124">られ</span><span begin="54.124" end="54.524">な</span><span begin="54.524" end="54.724">い</span><span begin="54.724" end="55.007">ま</span><span begin="55.007" end="57.107">ま</span></p></div><div begin="57.179" end="1:31.643"><p begin="57.179" end="1:04.186" ttm:agent="v1"><span begin="57.179" end="57.674">隠</span><span begin="57.674" end="57.941">し</span><span begin="57.941" end="58.525">事</span><span begin="58.525" end="58.741">だ</span><span begin="58.741" end="58.957">ら</span><span begin="58.957" end="59.341">け</span> <span begin="59.341" end="59.541">継</span><span begin="59.541" end="59.922">ぎ</span><span begin="59.922" end="1:00.125">接</span><span begin="1:00.125" end="1:00.557">ぎ</span><span begin="1:00.557" end="1:01.341">だらけの</span><span begin="1:01.341" end="1:02.397">Home,</span> <span begin="1:02.397" end="1:02.706">you</span> <span begin="1:02.706" end="1:04.186">know?</span></p><p begin="1:04.381" end="1:10.423" ttm:agent="v1"><span begin="1:04.381" end="1:04.903">噛</span><span begin="1:04.903" end="1:05.058">み</span><span begin="1:05.058" end="1:05.521">砕</span><span begin="1:05.521" end="1:05.753">い</span><span begin="1:05.753" end="1:06.055">ても</span><span begin="1:06.055" end="1:06.521">無く</span><span begin="1:06.521" end="1:06.839">なら</span><span begin="1:06.839" end="1:07.186">ない</span> <span begin="1:07.388" end="1:07.788">本</span><span begin="1:07.788" end="1:08.137">音</span><span begin="1:08.137" end="1:08.321">が</span><span begin="1:08.321" end="1:08.715">歯</span><span begin="1:08.715" end="1:08.988">に</span><span begin="1:08.988" end="1:09.353">挟</span><span begin="1:09.353" end="1:09.772">まっ</span><span begin="1:09.772" end="1:10.004">た</span><span begin="1:10.004" end="1:10.423">まま</span></p><p begin="1:10.447" end="1:16.981" ttm:agent="v1"><span begin="1:10.447" end="1:10.730">不</span><span begin="1:10.730" end="1:11.279">安</span><span begin="1:11.279" end="1:11.479">だ</span><span begin="1:11.479" end="1:11.698">ら</span><span begin="1:11.698" end="1:12.025">け</span> <span begin="1:12.114" end="1:12.746">成り</span><span begin="1:12.746" end="1:13.314">行き</span><span begin="1:13.314" end="1:13.679">任</span><span begin="1:13.679" end="1:14.079">せの</span><span begin="1:14.079" end="1:15.146">Life,</span> <span begin="1:15.146" end="1:15.295">and</span> <span begin="1:15.295" end="1:15.479">I</span> <span begin="1:15.479" end="1:16.981">know</span></p><p begin="1:17.225" end="1:25.381" ttm:agent="v1"><span begin="1:17.225" end="1:17.708">仮</span><span begin="1:17.708" end="1:18.163">初め</span><span begin="1:18.163" end="1:18.940">まみれの</span><span begin="1:18.940" end="1:19.290">日</span><span begin="1:19.290" end="1:19.812">常</span><span begin="1:19.924" end="1:20.340">だけ</span><span begin="1:20.340" end="1:20.637">ど</span> <span begin="1:20.724" end="1:21.290">ここに</span><span begin="1:21.290" end="1:21.690">僕</span><span begin="1:21.690" end="1:22.175">が居</span><span begin="1:22.175" end="1:22.542">て</span> <span begin="1:22.740" end="1:23.524">あなたが</span><span begin="1:23.524" end="1:23.775">居</span><span begin="1:23.775" end="1:25.381">る</span></p><p begin="1:25.465" end="1:31.643" ttm:agent="v1"><span begin="1:25.465" end="1:25.907">この</span><span begin="1:25.907" end="1:26.742">真実</span><span begin="1:26.742" end="1:26.942">だ</span><span begin="1:26.942" end="1:27.523">け</span><span begin="1:27.523" end="1:27.774">で</span><span begin="1:27.774" end="1:28.163">もう</span> <span begin="1:28.323" end="1:28.558">胃</span><span begin="1:28.558" end="1:29.123">が</span><span begin="1:29.123" end="1:29.974">もたれて</span><span begin="1:29.974" end="1:30.142">ゆ</span><span begin="1:30.142" end="1:31.643">く</span></p></div><div begin="1:33.353" end="2:00.503"><p begin="1:33.353" end="1:39.302" ttm:agent="v1"><span begin="1:33.353" end="1:34.077">化けの</span><span begin="1:34.077" end="1:34.493">皮</span><span begin="1:34.493" end="1:34.909">剥が</span><span begin="1:34.909" end="1:35.309">れ</span><span begin="1:35.309" end="1:35.626">た</span><span begin="1:35.626" end="1:35.980">一</span><span begin="1:35.980" end="1:36.194">粒</span><span begin="1:36.194" end="1:36.576">の</span><span begin="1:36.576" end="1:37.339">ピーナッツ</span><span begin="1:37.709" end="1:38.128">み</span><span begin="1:38.128" end="1:38.728">た</span><span begin="1:38.728" end="1:38.909">い</span><span begin="1:38.909" end="1:39.302">に</span></p><p begin="1:39.361" end="1:46.021" ttm:agent="v1"><span begin="1:39.361" end="1:39.706">世</span><span begin="1:39.706" end="1:40.306">間</span><span begin="1:40.306" end="1:40.490">か</span><span begin="1:40.490" end="1:40.906">ら</span><span begin="1:40.906" end="1:41.706">一瞬</span><span begin="1:41.706" end="1:41.957">で</span><span begin="1:41.957" end="1:42.490">弾</span><span begin="1:42.490" end="1:43.370">かれて</span><span begin="1:43.573" end="1:44.132">しまう</span> <span begin="1:44.506" end="1:45.106">そんな</span><span begin="1:45.106" end="1:45.484">時</span><span begin="1:45.484" end="1:45.706">こ</span><span begin="1:45.706" end="1:46.021">そ</span></p><p begin="1:46.250" end="1:51.851" ttm:agent="v1"><span begin="1:46.250" end="1:47.471">曲がりなりで</span><span begin="1:47.471" end="1:47.703">良</span><span begin="1:47.703" end="1:48.154">かっ</span><span begin="1:48.154" end="1:48.570">た</span><span begin="1:48.570" end="1:48.860">ら</span><span begin="1:48.954" end="1:49.322">そば</span><span begin="1:49.322" end="1:49.722">に</span><span begin="1:49.722" end="1:50.138">居</span><span begin="1:50.138" end="1:50.789">さ</span><span begin="1:50.789" end="1:50.938">せ</span><span begin="1:50.938" end="1:51.851">て</span></p><p begin="1:51.882" end="2:00.503" ttm:agent="v1"><span begin="1:51.882" end="1:52.367">共</span><span begin="1:52.367" end="1:52.652">に</span><span begin="1:52.770" end="1:53.422">煎られ</span> <span begin="1:53.501" end="1:54.138">揺られ</span> <span begin="1:54.269" end="1:55.085">踏まれ</span><span begin="1:55.085" end="1:55.303">て</span><span begin="1:55.303" end="1:55.794">も</span> <span begin="1:55.951" end="1:56.485">割れな</span><span begin="1:56.485" end="1:56.735">い</span><span begin="1:56.735" end="1:57.069">殻</span><span begin="1:57.069" end="1:57.303">み</span><span begin="1:57.303" end="1:57.903">たい</span><span begin="1:57.903" end="1:58.187">に</span><span begin="1:58.187" end="1:58.602">な</span><span begin="1:58.602" end="1:58.919">るか</span><span begin="1:58.919" end="2:00.503">ら</span></p></div><div begin="2:01.214" end="2:17.069"><p begin="2:01.214" end="2:07.625" ttm:agent="v1"><span begin="2:01.214" end="2:02.051">生まれた</span><span begin="2:02.051" end="2:02.702">場所</span><span begin="2:02.702" end="2:02.843">が</span><span begin="2:02.843" end="2:03.710">木の上</span><span begin="2:03.710" end="2:04.035">か</span><span begin="2:04.142" end="2:04.374">地</span><span begin="2:04.374" end="2:04.758">面</span><span begin="2:04.758" end="2:04.990">の</span><span begin="2:04.990" end="2:05.358">中</span><span begin="2:05.358" end="2:05.636">か</span> <span begin="2:05.675" end="2:05.941">そ</span><span begin="2:05.941" end="2:06.806">れだけの</span><span begin="2:06.806" end="2:06.947">違</span><span begin="2:06.947" end="2:07.625">い</span></p><p begin="2:07.579" end="2:17.069" ttm:agent="v1"><span begin="2:07.579" end="2:08.163">許</span><span begin="2:08.163" end="2:08.915">されない</span><span begin="2:08.915" end="2:09.213">ほど</span><span begin="2:09.213" end="2:09.547">に</span><span begin="2:09.547" end="2:10.064">ドライ</span><span begin="2:10.064" end="2:10.480">な</span><span begin="2:10.480" end="2:10.831">この</span><span begin="2:10.831" end="2:11.130">世</span><span begin="2:11.130" end="2:11.530">界</span><span begin="2:11.530" end="2:11.779">を</span> <span begin="2:11.837" end="2:12.298">等</span><span begin="2:12.298" end="2:12.730">しく</span><span begin="2:12.730" end="2:13.098">雨</span><span begin="2:13.098" end="2:13.349">が</span><span begin="2:13.349" end="2:13.714">湿</span><span begin="2:13.714" end="2:14.098">らせ</span><span begin="2:14.098" end="2:14.663">ます</span><span begin="2:14.663" end="2:14.863">よう</span><span begin="2:14.863" end="2:17.069">に</span></p></div><div begin="2:17.193" end="2:45.906"><p begin="2:17.193" end="2:24.152" ttm:agent="v1"><span begin="2:17.193" end="2:17.671">時</span><span begin="2:17.671" end="2:17.919">に</span><span begin="2:17.919" end="2:18.519">冷</span><span begin="2:18.519" end="2:18.954">たく</span><span begin="2:18.954" end="2:19.354">て</span> <span begin="2:19.354" end="2:19.903">騒</span><span begin="2:19.903" end="2:20.087">が</span><span begin="2:20.087" end="2:20.538">しい</span><span begin="2:20.538" end="2:20.938">窓</span><span begin="2:20.938" end="2:21.138">の</span><span begin="2:21.138" end="2:21.386">向</span><span begin="2:21.386" end="2:22.604">こう</span><span begin="2:22.604" end="2:22.804">you</span> <span begin="2:22.804" end="2:24.152">know?</span></p><p begin="2:24.176" end="2:30.579" ttm:agent="v1"><span begin="2:24.176" end="2:24.873">星</span><span begin="2:24.873" end="2:25.057">の</span><span begin="2:25.057" end="2:25.790">一</span><span begin="2:25.790" end="2:25.958">つ</span><span begin="2:25.958" end="2:26.128">も</span><span begin="2:26.128" end="2:26.892">見つから</span><span begin="2:26.892" end="2:27.166">ない</span> <span begin="2:27.390" end="2:28.092">雷</span><span begin="2:28.092" end="2:28.358">に</span><span begin="2:28.358" end="2:28.873">満ちた</span><span begin="2:28.873" end="2:29.340">日が</span><span begin="2:29.340" end="2:30.579">あっても良い</span></p><p begin="2:30.698" end="2:36.884" ttm:agent="v1"><span begin="2:30.698" end="2:31.272">ミス</span><span begin="2:31.272" end="2:31.704">だら</span><span begin="2:31.704" end="2:32.120">け</span> <span begin="2:32.120" end="2:32.704">アド</span><span begin="2:32.704" end="2:32.888">リ</span><span begin="2:32.888" end="2:33.320">ブ</span><span begin="2:33.320" end="2:33.755">任</span><span begin="2:33.755" end="2:34.171">せの</span><span begin="2:34.171" end="2:35.139">Show,</span> <span begin="2:35.139" end="2:35.339">but</span> <span begin="2:35.339" end="2:35.605">I</span> <span begin="2:35.605" end="2:36.884">know</span></p><p begin="2:37.164" end="2:45.906" ttm:agent="v1"><span begin="2:37.164" end="2:37.417">所</span><span begin="2:37.417" end="2:37.833">詮</span><span begin="2:37.833" end="2:38.915">ひとかけの</span><span begin="2:38.915" end="2:39.745">日常</span><span begin="2:39.865" end="2:40.591">だから</span> <span begin="2:40.750" end="2:41.033">腹</span><span begin="2:41.033" end="2:41.347">の</span><span begin="2:41.347" end="2:41.715">中</span><span begin="2:41.715" end="2:42.166">にで</span><span begin="2:42.166" end="2:42.683">も</span> <span begin="2:42.683" end="2:43.049">流</span><span begin="2:43.049" end="2:43.700">して寝</span><span begin="2:43.700" end="2:45.906">よう</span></p></div><div begin="2:46.013" end="3:28.705"><p begin="2:46.013" end="2:52.930" ttm:agent="v1"><span begin="2:46.013" end="2:46.490">隠</span><span begin="2:46.490" end="2:46.756">し</span><span begin="2:46.756" end="2:47.340">事</span><span begin="2:47.340" end="2:47.524">だ</span><span begin="2:47.524" end="2:47.756">ら</span><span begin="2:47.756" end="2:48.140">け</span> <span begin="2:48.140" end="2:48.306">継</span><span begin="2:48.306" end="2:48.740">ぎ</span><span begin="2:48.740" end="2:48.906">接</span><span begin="2:48.906" end="2:49.356">ぎ</span><span begin="2:49.356" end="2:50.140">だらけの</span><span begin="2:50.140" end="2:51.251">Home,</span> <span begin="2:51.251" end="2:51.490">you</span> <span begin="2:51.490" end="2:52.930">know?</span></p><p begin="2:53.108" end="2:59.232" ttm:agent="v1"><span begin="2:53.108" end="2:53.670">とっ</span><span begin="2:53.670" end="2:54.486">ておき</span><span begin="2:54.486" end="2:54.737">も</span><span begin="2:54.737" end="2:54.916">出</span><span begin="2:54.916" end="2:55.263">来</span><span begin="2:55.263" end="2:55.493">合</span><span begin="2:55.493" end="2:55.638">い</span><span begin="2:55.638" end="2:55.975">も</span> <span begin="2:56.105" end="2:56.572">残</span><span begin="2:56.572" end="2:57.153">さずに</span><span begin="2:57.153" end="2:57.521">全</span><span begin="2:57.521" end="2:57.737">部</span><span begin="2:57.737" end="2:57.937">食</span><span begin="2:57.937" end="2:58.153">ら</span><span begin="2:58.153" end="2:58.436">い</span><span begin="2:58.436" end="2:58.737">な</span><span begin="2:58.737" end="2:58.953">が</span><span begin="2:58.953" end="2:59.232">ら</span></p><p begin="2:59.242" end="3:05.718" ttm:agent="v1"><span begin="2:59.242" end="2:59.602">普</span><span begin="2:59.602" end="3:00.152">通</span><span begin="3:00.152" end="3:00.568">など</span><span begin="3:00.568" end="3:00.986">ない</span> <span begin="3:00.986" end="3:01.552">正</span><span begin="3:01.552" end="3:02.168">解</span><span begin="3:02.168" end="3:02.552">など</span><span begin="3:02.552" end="3:02.968">ない</span><span begin="3:02.968" end="3:04.018">Life,</span> <span begin="3:04.018" end="3:04.193">and</span> <span begin="3:04.193" end="3:04.368">I</span> <span begin="3:04.368" end="3:05.718">know</span></p><p begin="3:06.037" end="3:14.175" ttm:agent="v1"><span begin="3:06.037" end="3:06.539">仮</span><span begin="3:06.539" end="3:07.739">初めまみれの</span><span begin="3:07.739" end="3:08.107">日</span><span begin="3:08.107" end="3:08.550">常</span><span begin="3:08.723" end="3:09.456">だけど</span> <span begin="3:09.555" end="3:10.139">ここに</span><span begin="3:10.139" end="3:10.523">僕</span><span begin="3:10.523" end="3:10.739">が</span><span begin="3:10.739" end="3:10.973">居</span><span begin="3:10.973" end="3:11.363">て</span> <span begin="3:11.573" end="3:12.307">あなたが</span><span begin="3:12.307" end="3:12.523">居</span><span begin="3:12.523" end="3:14.175">る</span></p><p begin="3:14.188" end="3:20.606" ttm:agent="v1"><span begin="3:14.188" end="3:14.654">この</span><span begin="3:14.654" end="3:15.051">真</span><span begin="3:15.051" end="3:15.486">実</span><span begin="3:15.486" end="3:15.737">だ</span><span begin="3:15.737" end="3:16.353">け</span><span begin="3:16.353" end="3:16.521">で</span><span begin="3:16.521" end="3:16.887">もう</span> <span begin="3:17.102" end="3:17.321">胃</span><span begin="3:17.321" end="3:17.960">が</span><span begin="3:17.960" end="3:18.537">もたれ</span><span begin="3:18.537" end="3:18.753">て</span><span begin="3:18.753" end="3:18.937">ゆ</span><span begin="3:18.937" end="3:20.606">く</span></p><p begin="3:20.616" end="3:28.705" ttm:agent="v1"><span begin="3:20.616" end="3:21.164">この</span><span begin="3:21.164" end="3:21.546">一</span><span begin="3:21.546" end="3:21.879">掴</span><span begin="3:21.879" end="3:22.130">み</span><span begin="3:22.130" end="3:22.698">の</span><span begin="3:22.698" end="3:22.946">奇</span><span begin="3:22.946" end="3:23.479">跡</span><span begin="3:23.479" end="3:23.807">を</span> <span begin="3:23.930" end="3:24.346">噛</span><span begin="3:24.346" end="3:24.596">み</span><span begin="3:24.596" end="3:25.098">締めて</span><span begin="3:25.098" end="3:25.364">ゆ</span><span begin="3:25.364" end="3:28.705">く</span></p></div></body></tt>`,
      'text/xml'
    );
    const result = parser.parse(xml, 'syllable');
    expect(result.resourceID).toBe('syllable');
    expect(result.timingType).toBe('Word');
    expect(result.duration).toBe(213.99);
    expect(result.voids().length).toBe(59);
  });

  it('should parse line TTML document', () => {
    const xml = new DOMParser().parseFromString(
      `<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttm="http://www.w3.org/ns/ttml#metadata" xml:lang="ja"><head><metadata><ttm:agent type="person" xml:id="v1"/></metadata></head><body dur="3:29.467"><div begin="11.826" end="30.867"><p begin="11.826" end="14.988" ttm:agent="v1">出会って知って 埋まったこの距離は</p><p begin="17.230" end="20.243" ttm:agent="v1">変な感じ 全然慣れないや</p><p begin="21.626" end="25.678" ttm:agent="v1">すべてが逆さまになっちゃったみたい</p><p begin="26.302" end="30.867" ttm:agent="v1">夢みたいなんだ 夢じゃないんだ</p></div><div begin="30.877" end="50.682"><p begin="30.877" end="40.831" ttm:agent="v1">きみがくれるSOSは 僕が全部大丈夫にしたい</p><p begin="41.439" end="50.682" ttm:agent="v1">ふたりぼっちでも大作戦 叶えたいことが曇らないように</p></div><div begin="51.273" end="1:11.576"><p begin="51.273" end="54.885" ttm:agent="v1">もっともっと近付きたいよ</p><p begin="54.888" end="1:01.203" ttm:agent="v1">何度困ってもいいよなんて ひどいかな</p><p begin="1:01.784" end="1:05.448" ttm:agent="v1">ずっとずっとそばにいたいよ</p><p begin="1:05.773" end="1:11.576" ttm:agent="v1">見失っちゃう僕ら 絶対探し合おう</p></div><div begin="1:11.586" end="1:20.300"><p begin="1:11.586" end="1:16.301" ttm:agent="v1">心がふわってしちゃって これっておかしいのかな</p><p begin="1:16.792" end="1:20.300" ttm:agent="v1">この想いの名前を教えて</p></div><div begin="1:25.274" end="1:44.294"><p begin="1:25.274" end="1:28.386" ttm:agent="v1">ひょっとしてきみも同じ気持ち？</p><p begin="1:30.663" end="1:33.707" ttm:agent="v1">勘違いか正解 どっちだろう</p><p begin="1:35.009" end="1:38.987" ttm:agent="v1">確かめたら終わってしまう気がして</p><p begin="1:39.687" end="1:44.294" ttm:agent="v1">ただ笑っていた 嫌われないように</p></div><div begin="1:44.304" end="2:04.194"><p begin="1:44.304" end="1:54.843" ttm:agent="v1">きみがくれるSOSが ずっとずっと止まないでほしいとか</p><p begin="1:54.843" end="2:04.194" ttm:agent="v1">きみと会える理由になるとか 馬鹿みたいだよな…言えやしないのに</p></div><div begin="2:04.761" end="2:25.041"><p begin="2:04.761" end="2:08.318" ttm:agent="v1">もっともっと聴いていたいよ</p><p begin="2:08.318" end="2:14.656" ttm:agent="v1">頬も染まっちゃう距離で きみの願い事</p><p begin="2:15.209" end="2:18.779" ttm:agent="v1">ずっとずっと変わらないよ</p><p begin="2:18.779" end="2:25.041" ttm:agent="v1">退屈なんて言葉は 忘れちゃっていいよね</p></div><div begin="2:25.051" end="2:46.822"><p begin="2:25.051" end="2:26.752" ttm:agent="v1">まだまだ きっと</p><p begin="2:29.661" end="2:31.970" ttm:agent="v1">まだまだまだ もう一歩</p><p begin="2:34.179" end="2:37.290" ttm:agent="v1">まだまだまだまだ ねえ知りたいよ</p><p begin="2:38.843" end="2:42.394" ttm:agent="v1">まだまだまだまだまだ 仲良しの端っこ</p><p begin="2:42.643" end="2:46.822" ttm:agent="v1">まるで足りない</p></div><div begin="2:47.984" end="3:08.296"><p begin="2:47.984" end="2:51.598" ttm:agent="v1">もっともっと近付きたいよ</p><p begin="2:51.608" end="2:58.114" ttm:agent="v1">何度困ってもいいよ 僕が守るから</p><p begin="2:58.555" end="3:02.194" ttm:agent="v1">ずっとずっとそばにいたいよ</p><p begin="3:02.423" end="3:08.296" ttm:agent="v1">見失っちゃう僕ら 絶対探し合おう</p></div><div begin="3:08.306" end="3:17.238"><p begin="3:08.306" end="3:13.139" ttm:agent="v1">心がふわってしちゃって これっておかしいのかな</p><p begin="3:13.525" end="3:17.238" ttm:agent="v1">この想いの名前を教えて</p></div><div begin="3:22.618" end="3:26.416"><p begin="3:22.618" end="3:26.416" ttm:agent="v1">その気持ちの名前を教えて</p></div></body></tt>`,
      'text/xml'
    );
    const result = parser.parse(xml, 'line');
    expect(result.resourceID).toBe('line');
    expect(result.timingType).toBe('Line');
    expect(result.duration).toBe(209.47);
    expect(result.voids().length).toBe(32);
  });
});
