@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.scoremap.planning92

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.shape.RoundedCornerShape

// A disposable, static planning prototype. Every handler is intentionally inert.
// Pitches below are synthetic authored notes, never derived from chord symbols.
class MainActivity: ComponentActivity() {
 override fun onCreate(savedInstanceState:Bundle?) {
  super.onCreate(savedInstanceState); enableEdgeToEdge()
  val view=intent.getStringExtra("view") ?: "library"
  setContent { MaterialTheme(colorScheme=lightColorScheme(primary=Color(0xff006a75),onPrimary=Color.White,surface=Color(0xfffafcfc),onSurface=Color(0xff173440),surfaceContainer=Color(0xffeef3f3),outline=Color(0xff71868a),background=Color(0xfffafcfc),onBackground=Color(0xff173440),secondaryContainer=Color(0xffd7edef),onSecondaryContainer=Color(0xff173440),surfaceContainerLow=Color(0xffeef3f3),surfaceContainerHighest=Color(0xffe0ebec)),typography=Typography(),shapes=Shapes(small=RoundedCornerShape(4.dp),medium=RoundedCornerShape(8.dp))) {
   when(view) { "editor" -> Editor(); "consult" -> Consult(); "import" -> ImportPreview(); "error" -> ImportError(); else -> Library() }
  } }
 }
}
@Composable fun Mode(protected:Boolean=false) { FilterChip(selected=!protected,onClick={},label={Text(if(protected) "Protected" else "Edit mode on")},modifier=Modifier.heightIn(min=48.dp)) }
@Composable fun Header(title:String,back:Boolean=true,protected:Boolean=false,save:Boolean=false) {
 TopAppBar(title={ Column { Text(title,style=MaterialTheme.typography.titleLarge); if(save) Text("Unsaved changes",style=MaterialTheme.typography.labelMedium) } },navigationIcon={if(back) TextButton(onClick={},modifier=Modifier.heightIn(min=48.dp)){Text("Back")}},actions={Mode(protected); Spacer(Modifier.width(8.dp)); if(save) Button(onClick={},modifier=Modifier.heightIn(min=48.dp)){Text("Save")} else if(protected) TextButton(onClick={},modifier=Modifier.heightIn(min=48.dp)){Text("Edit")}; Spacer(Modifier.width(12.dp))})
}
@Composable fun MainButton(label:String,outline:Boolean=false,modifier:Modifier=Modifier) { if(outline) OutlinedButton(onClick={},modifier=modifier.heightIn(min=56.dp),shape=RoundedCornerShape(6.dp)){Text(label)} else Button(onClick={},modifier=modifier.heightIn(min=56.dp),shape=RoundedCornerShape(6.dp)){Text(label)} }
@Composable fun Library() {
 Scaffold(topBar={Header("ScoreMap",back=false)}) { padding -> Column(Modifier.padding(padding).fillMaxSize()) {
  PrimaryTabRow(selectedTabIndex=0) { Tab(selected=true,onClick={},text={Text("Songs")},modifier=Modifier.heightIn(min=48.dp)); Tab(selected=false,onClick={},text={Text("Sets")},modifier=Modifier.heightIn(min=48.dp)) }
  Column(Modifier.padding(24.dp).fillMaxSize().verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(16.dp)) {
   Text("LOCAL LIBRARY",style=MaterialTheme.typography.labelLarge,color=MaterialTheme.colorScheme.primary)
   Spacer(Modifier.height(48.dp))
   Text("Your library\nstarts here",style=MaterialTheme.typography.headlineLarge)
   Text("Keep your songs, chords and sets together on this device.",style=MaterialTheme.typography.bodyLarge)
   Text("Works offline. No account needed.",style=MaterialTheme.typography.bodyMedium)
   Spacer(Modifier.height(24.dp))
   MainButton("Create song",modifier=Modifier.fillMaxWidth())
   MainButton("Import",outline=true,modifier=Modifier.fillMaxWidth())
   Text("Import a song or a complete set shared by your group.",style=MaterialTheme.typography.bodyMedium)
  }
 } }
}
@Composable fun ImportPreview() {
 Scaffold(topBar={Header("Import set")},bottomBar={ Surface { Row(Modifier.navigationBarsPadding().padding(16.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)) { MainButton("Cancel",true,Modifier.weight(1f)); MainButton("Import copies",modifier=Modifier.weight(1.4f)) } } }) { padding -> Column(Modifier.padding(padding).padding(horizontal=24.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)) {
  Spacer(Modifier.height(8.dp)); Text("Friday Rehearsal",style=MaterialTheme.typography.headlineMedium)
  Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) { Text("4 songs · 1 owned PDF",style=MaterialTheme.typography.titleMedium,color=MaterialTheme.colorScheme.primary); Spacer(Modifier.weight(1f)); Text("Edit mode on",style=MaterialTheme.typography.labelMedium) }
  Text("Import as independent editable copies.",style=MaterialTheme.typography.bodyLarge)
  Text("Your existing music stays unchanged.",style=MaterialTheme.typography.bodyMedium)
  listOf("The Quiet Atlas","Glass Harbour","Northbound","After the Rain").forEachIndexed { i,title -> ListItem(headlineContent={Text(title)},supportingContent={Text("Song ${i+1}")}); HorizontalDivider() }
  ListItem(headlineContent={Text("Rehearsal score.pdf")},supportingContent={Text("Owned PDF · included in this set")})
  Spacer(Modifier.height(16.dp))
 } }
}
@Composable fun ImportError() {
 Scaffold(topBar={Header("Import")}) { padding -> Column(Modifier.padding(padding).padding(24.dp).fillMaxSize().verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(16.dp)) {
  Spacer(Modifier.height(48.dp)); Text("Your library\nis unchanged",style=MaterialTheme.typography.headlineLarge)
  Text("This file couldn’t be read.",style=MaterialTheme.typography.titleLarge)
  Text("Friday Rehearsal.scoremap",style=MaterialTheme.typography.bodyMedium)
  Text("Nothing has been added or replaced. Try importing the file again.",style=MaterialTheme.typography.bodyLarge)
  Spacer(Modifier.height(24.dp)); MainButton("Try again",modifier=Modifier.fillMaxWidth()); MainButton("Cancel",true,Modifier.fillMaxWidth())
 } }
}
val palette=listOf(0xffd8bce9 to 0xff704190,0xffc9c6ed to 0xff51479c,0xffb8d7ee to 0xff276698,0xffaee0df to 0xff116d6e,0xffc8e6bd to 0xff4d7e39,0xfff4e2a4 to 0xff8e7021,0xfff5ceaa to 0xffa45d25,0xffedbdc1 to 0xff9a4552,0xffe2c6da to 0xffe2c6da)
fun note(midi:Int)=listOf("C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B")[midi%12]+(midi/12-1)
fun white(midi:Int)=midi%12 in listOf(0,2,4,5,7,9,11)
@Composable fun Piano(notes:Set<Int>,lo:Int=36,hi:Int=83,height:Int=94,small:Boolean=false) {
 Canvas(Modifier.fillMaxWidth().height(height.dp)) {
  val whites=(lo..hi).filter(::white); val w=size.width/whites.size; val blackH=size.height*.62f
  val paint=android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { textAlign=android.graphics.Paint.Align.CENTER; typeface=android.graphics.Typeface.create("sans-serif",android.graphics.Typeface.NORMAL); textSize=12.sp.toPx() }
  whites.forEachIndexed { i,n ->
   val x=i*w; val fill=if(n in notes) Color(palette[n/12-1].first) else Color.White
   drawRect(fill,Offset(x,0f),Size(w,size.height)); drawRect(Color(0xff71868a),Offset(x,0f),Size(w,size.height),style=androidx.compose.ui.graphics.drawscope.Stroke(.6.dp.toPx()))
   if(n in notes || n%12==0) {paint.color=android.graphics.Color.rgb(23,52,64); drawContext.canvas.nativeCanvas.drawText(note(n),x+w/2,size.height-7.dp.toPx(),paint)}
  }
  (lo..hi).filterNot(::white).forEach { n ->
   val preceding=whites.indexOfLast {it<n}; val x=(preceding+1)*w-w*.31f
   drawRect(if(n in notes) Color(palette[n/12-1].second) else Color(0xff173440),Offset(x,0f),Size(w*.62f,blackH))
   if(n in notes) {paint.color=android.graphics.Color.WHITE; drawContext.canvas.nativeCanvas.drawText(note(n),x+w*.31f,blackH-6.dp.toPx(),paint)}
  }
 }
}
@Composable fun Hands(left:String,right:String) { Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(24.dp)) { Text("LH  $left",style=MaterialTheme.typography.labelLarge); Text("RH  $right",style=MaterialTheme.typography.labelLarge) } }
data class ChordRow(val chord:String,val left:List<Int>,val right:List<Int>)
val syntheticRows=listOf(ChordRow("Cmaj7",listOf(48,55),listOf(64,67,71,72)),ChordRow("Am7",listOf(45,52),listOf(55,60,64)),ChordRow("Dm7",listOf(50,57),listOf(65,69,72)),ChordRow("G7",listOf(43,50),listOf(65,67,71)))
@Composable fun Consult() {
 Scaffold(topBar={Header("The Quiet Atlas",protected=true)}) { padding -> Column(Modifier.padding(padding).padding(horizontal=24.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)) {
  Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) { Text("Verse",style=MaterialTheme.typography.headlineSmall); SuggestionChip(onClick={},label={Text("Repeat 2×")},modifier=Modifier.heightIn(min=48.dp)); Text("C major",style=MaterialTheme.typography.bodyLarge); Spacer(Modifier.weight(1f)); Text("Stage keys",style=MaterialTheme.typography.labelLarge) }
  Text("Hold the light, we’ll find our way.",style=MaterialTheme.typography.bodyLarge)
  syntheticRows.forEach { row ->
   HorizontalDivider(); Row(Modifier.fillMaxWidth().padding(vertical=8.dp),horizontalArrangement=Arrangement.spacedBy(20.dp),verticalAlignment=Alignment.CenterVertically) {
    Text(row.chord,style=MaterialTheme.typography.headlineSmall,modifier=Modifier.width(92.dp))
    Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(6.dp)) { Piano((row.left+row.right).toSet(),height=72); Hands(row.left.joinToString(" ",transform=::note),row.right.joinToString(" ",transform=::note)) }
   }
  }
  Spacer(Modifier.height(16.dp))
 } }
}
@Composable fun PitchStaff() {
 Column(verticalArrangement=Arrangement.spacedBy(8.dp)) {
  Text("Pitch-only staff",style=MaterialTheme.typography.titleMedium)
  Canvas(Modifier.fillMaxWidth().height(160.dp)) {
   val gap=10.dp.toPx(); val start=52.dp.toPx(); val end=size.width-8.dp.toPx()
   val paint=android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {color=android.graphics.Color.rgb(23,52,64);textSize=12.sp.toPx();typeface=android.graphics.Typeface.create("sans-serif",0)}
   listOf(25,35,45,55,65,90,100,110,120,130).forEach { y ->drawLine(Color(0xff71868a),Offset(start,y.dp.toPx()),Offset(end,y.dp.toPx()),1.dp.toPx()) }
   drawContext.canvas.nativeCanvas.drawText("RH",0f,48.dp.toPx(),paint);drawContext.canvas.nativeCanvas.drawText("LH",0f,113.dp.toPx(),paint)
   listOf(Triple("E4",65,0),Triple("G4",55,1),Triple("C5",40,2),Triple("C3",115,0),Triple("G3",95,1)).forEach { (label,y,index) -> val x=start+28.dp.toPx()+index*58.dp.toPx();drawOval(Color(0xff173440),Offset(x,y.dp.toPx()-4.dp.toPx()),Size(12.dp.toPx(),8.dp.toPx()));drawContext.canvas.nativeCanvas.drawText(label,x+14.dp.toPx(),y.dp.toPx()-7.dp.toPx(),paint) }
  }
  Text("Timing not set",style=MaterialTheme.typography.bodyMedium)
 }
}
@Composable fun Editor() {
 val pitches=setOf(48,55,64,67,72)
 Scaffold(topBar={Header("Edit The Quiet Atlas",save=true)}) { padding -> Column(Modifier.padding(padding).padding(horizontal=24.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)) {
  Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) { listOf("Stage keys","Synth","Aux").forEachIndexed {i,s -> FilterChip(selected=i==0,onClick={},label={Text(s)},modifier=Modifier.heightIn(min=48.dp))} }
  Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)) {Text("Verse · Measure 3",style=MaterialTheme.typography.titleLarge); listOf(1,2,3,4).forEach {n -> FilterChip(selected=n==3,onClick={},label={Text("$n")},modifier=Modifier.heightIn(min=48.dp))} }
  Row(horizontalArrangement=Arrangement.spacedBy(16.dp)) { OutlinedTextField(value="Hold the light, we’ll find our way.",onValueChange={},readOnly=true,label={Text("Lyrics")},modifier=Modifier.weight(1f)); OutlinedTextField(value="C",onValueChange={},readOnly=true,label={Text("Chord")},modifier=Modifier.width(150.dp)) }
  Text("Full keyboard · A0–C8",style=MaterialTheme.typography.labelLarge); Piano(pitches,21,108,64,true)
  Row(horizontalArrangement=Arrangement.spacedBy(24.dp)) {
   Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(12.dp)) { Text("Played notes · C2–B5",style=MaterialTheme.typography.titleMedium); Piano(pitches,height=160); Hands("C3 G3","E4 G4 C5"); Text("Octave colours identify pitch register. Hands are labelled separately.",style=MaterialTheme.typography.bodyMedium) }
   Column(Modifier.width(300.dp)) { PitchStaff() }
  }
  Spacer(Modifier.height(16.dp))
 } }
}
