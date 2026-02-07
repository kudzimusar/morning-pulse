# Ask Pulse AI - Comprehensive Testing Guide

## 🎯 Overview
This guide provides step-by-step instructions to test all the enhancements made to the Ask Pulse AI feature, including:
- Comprehensive AI rules implementation
- Conversation tracking and context awareness
- Question-based retrieval with category variety
- Opinion summaries in responses
- UI fixes (layout, share buttons, bookmarks)

---

## 📋 Pre-Testing Checklist

Before starting, ensure:
- [ ] Code has been pushed to GitHub
- [ ] GitHub Actions workflow has completed deployment
- [ ] Backend proxy function is deployed (check Cloud Functions)
- [ ] Frontend is accessible (local or deployed)

---

## 🧪 Testing Phase 1: UI Layout & Basic Functionality

### Test 1.1: Chatbot Layout (Full-Width)
**Expected:** Chatbot should take full width, no grid layout, no blank right side

**Steps:**
1. Navigate to the Ask Pulse AI page (`#askai`)
2. **Verify:**
   - Chatbot interface takes full width of the screen
   - No grid layout visible
   - No blank space on the right side
   - Trending sidebar is NOT visible on this page

**✅ Pass Criteria:** Chatbot is full-width, no grid, no blank space

---

### Test 1.2: Share Button Functionality
**Expected:** Share buttons should open share menu, NOT navigate to article

**Steps:**
1. Ask a question in the chatbot (e.g., "What's the news today?")
2. Wait for AI response with article cards
3. Click the "Share" button on any article card
4. **Verify:**
   - Share menu/dropdown appears
   - Article card does NOT navigate/click through
   - You can select a social media platform
   - Share window opens when platform is selected

**✅ Pass Criteria:** Share button opens menu, doesn't navigate

---

### Test 1.3: Bookmark Button Functionality
**Expected:** Bookmark button should save article without navigating

**Steps:**
1. In an AI response with article cards, click the bookmark icon
2. **Verify:**
   - Toast notification appears ("Saved for later!" or similar)
   - Article card does NOT navigate
   - Bookmark icon changes state (filled/unfilled)

**✅ Pass Criteria:** Bookmark works without navigation

---

### Test 1.4: Bookmarks Page - Clickable Cards
**Expected:** Entire bookmark card should be clickable, not just title

**Steps:**
1. Navigate to Bookmarks page (`#bookmarks`)
2. Click anywhere on a bookmark card (not just the title)
3. **Verify:**
   - Card navigates to the article
   - Remove button (X) stops propagation (doesn't navigate when clicked)

**✅ Pass Criteria:** Entire card is clickable, remove button works independently

---

### Test 1.5: Opinion Feed - Single Share Button
**Expected:** Only one share button visible (bottom section), not top-left

**Steps:**
1. Navigate to Opinions page
2. Click on any opinion to view full article
3. **Verify:**
   - NO share button in top-left corner
   - Share button appears at bottom ("Share this perspective" section)
   - Share button works correctly

**✅ Pass Criteria:** Only one share button, at bottom

---

## 🧪 Testing Phase 2: AI Intelligence & Question-Based Retrieval

### Test 2.1: Question-Based Retrieval (Not Category-Based)
**Expected:** AI should answer based on user question intent, not just category

**Test Cases:**

#### Case A: Location-Specific Query
**Question:** "What happened in Nigeria?"

**Steps:**
1. Ask: "What happened in Nigeria?"
2. **Verify:**
   - Response includes Nigeria-related news
   - Articles from multiple categories if relevant
   - NOT limited to a single category

**✅ Pass Criteria:** Response focuses on Nigeria, not just one category

#### Case B: Person-Specific Query
**Question:** "What did the president say?"

**Steps:**
1. Ask: "What did the president say?"
2. **Verify:**
   - Response includes quotes/statements from president
   - Searches across all categories
   - Provides specific quotes with citations

**✅ Pass Criteria:** Finds president quotes across categories

#### Case C: Topic-Specific Query
**Question:** "Tell me about climate change"

**Steps:**
1. Ask: "Tell me about climate change"
2. **Verify:**
   - Response includes climate-related articles
   - Articles from different categories (politics, business, world, etc.)
   - NOT just one category

**✅ Pass Criteria:** Mixed categories, topic-focused

---

### Test 2.2: Category Variety (2 Articles Per Category)
**Expected:** When multiple categories match, should include 2 articles from each

**Steps:**
1. Ask a broad question: "What's in the news today?"
2. Check the article sources in the response
3. **Verify:**
   - Articles come from multiple categories
   - If 3+ categories match, you see 2 articles from each
   - Response is diverse, not all from one category

**✅ Pass Criteria:** Multiple categories represented, 2 per category when available

---

### Test 2.3: Opinion Summaries in Responses
**Expected:** AI should include opinion summaries when relevant

**Steps:**
1. Ask a question that might relate to opinions (e.g., "What are people saying about...?")
2. **Verify:**
   - Response mentions opinions if relevant
   - Uses [OPINION 1], [OPINION 2] notation
   - Includes top 3 most recent published opinions
   - Clearly identifies opinions vs. news articles

**✅ Pass Criteria:** Opinions included when relevant, properly cited

---

## 🧪 Testing Phase 3: Conversation Tracking & Context Awareness

### Test 3.1: Follow-Up Questions (Pronoun Resolution)
**Expected:** AI should understand pronouns from previous conversation

**Steps:**
1. Ask: "What's the news about climate change?"
2. Wait for response
3. Ask follow-up: "Who proposed these targets?" (referring to previous response)
4. **Verify:**
   - AI understands "these targets" refers to climate targets
   - Provides answer about who proposed them
   - Doesn't ask for clarification

**✅ Pass Criteria:** Follow-up question understood without clarification

---

### Test 3.2: Entity Tracking
**Expected:** AI should remember entities mentioned in conversation

**Steps:**
1. Ask: "Tell me about the trade deal"
2. Wait for response (mentions specific people/organizations)
3. Ask: "What did he say?" (referring to a person from previous response)
4. **Verify:**
   - AI knows who "he" refers to
   - Provides quotes/statements from that person
   - Doesn't ask "who is 'he'?"

**✅ Pass Criteria:** Pronoun resolution works correctly

---

### Test 3.3: Context Continuity
**Expected:** AI should maintain context across multiple questions

**Steps:**
1. Ask: "What happened in the election?"
2. Ask: "What about the senate?" (referring to election)
3. Ask: "When did this happen?"
4. **Verify:**
   - Each follow-up question is understood in context
   - AI doesn't lose track of the topic
   - Responses build on previous conversation

**✅ Pass Criteria:** Context maintained across multiple questions

---

## 🧪 Testing Phase 4: Comprehensive AI Rules

### Test 4.1: WHO Questions
**Question:** "Who is involved in the trade dispute?"

**Expected:**
- Lists all people mentioned
- Includes their roles/titles
- Cites sources with [1], [2], etc.

**✅ Pass Criteria:** Comprehensive list of people with roles and citations

---

### Test 4.2: WHAT Questions
**Question:** "What did the court decide?"

**Expected:**
- Explains the ruling
- Provides reasoning if mentioned
- Includes implications
- Cites sources

**✅ Pass Criteria:** Detailed explanation with citations

---

### Test 4.3: WHERE Questions
**Question:** "Where did the protest happen?"

**Expected:**
- Specific location (city, country)
- Geographic context
- Any landmarks mentioned

**✅ Pass Criteria:** Specific location details

---

### Test 4.4: WHEN Questions
**Question:** "When will the policy take effect?"

**Expected:**
- Exact dates if available
- Timeline context
- Any phases mentioned

**✅ Pass Criteria:** Specific dates/timeline

---

### Test 4.5: WHY Questions
**Question:** "Why did the stock market fall?"

**Expected:**
- Explains causes/factors
- Background context
- Contributing factors

**✅ Pass Criteria:** Comprehensive explanation of causes

---

### Test 4.6: HOW Questions
**Question:** "How will the new law work?"

**Expected:**
- Explains process/method
- Implementation details
- Steps or mechanisms

**✅ Pass Criteria:** Detailed process explanation

---

### Test 4.7: Multi-Part Questions
**Question:** "Who was involved and what happened?"

**Expected:**
- Addresses each part separately
- Clear structure (WHO: ..., WHAT: ...)
- Comprehensive answer

**✅ Pass Criteria:** All parts answered clearly

---

### Test 4.8: Comparison Questions
**Question:** "How do the two infrastructure plans compare?"

**Expected:**
- Compares both plans
- Highlights differences
- Cites sources for each

**✅ Pass Criteria:** Clear comparison with citations

---

### Test 4.9: Fact-Checking Questions
**Question:** "Is it true that [specific claim]?"

**Expected:**
- Verifies against articles
- Cites source if found
- Says clearly if not found

**✅ Pass Criteria:** Accurate fact-checking with sources

---

### Test 4.10: Missing Information Handling
**Question:** "What did Bernie Sanders say about this?" (when not mentioned)

**Expected:**
- Clearly states information not available
- Mentions what IS available
- Doesn't make up information

**✅ Pass Criteria:** Honest about limitations

---

## 🧪 Testing Phase 5: Edge Cases & Error Handling

### Test 5.1: Empty Query
**Steps:**
1. Try to submit empty query
2. **Verify:** Input is disabled or shows error

**✅ Pass Criteria:** Empty queries handled gracefully

---

### Test 5.2: Very Long Query
**Steps:**
1. Submit a very long question (500+ characters)
2. **Verify:** System handles it without errors

**✅ Pass Criteria:** Long queries processed successfully

---

### Test 5.3: Special Characters
**Steps:**
1. Submit query with special characters: "What's the news? #breaking"
2. **Verify:** Handled correctly

**✅ Pass Criteria:** Special characters don't break system

---

### Test 5.4: No Relevant Articles
**Question:** "Tell me about [completely unrelated topic not in news]"

**Expected:**
- Clear message that information not available
- Mentions what topics ARE available
- Doesn't make up information

**✅ Pass Criteria:** Graceful handling of no results

---

### Test 5.5: Network Error Simulation
**Steps:**
1. Disconnect internet
2. Submit a query
3. **Verify:** Error message shown, doesn't crash

**✅ Pass Criteria:** Network errors handled gracefully

---

## 📊 Testing Checklist Summary

### UI/UX Tests
- [ ] Chatbot full-width layout
- [ ] Share button opens menu (doesn't navigate)
- [ ] Bookmark button works without navigation
- [ ] Bookmark cards fully clickable
- [ ] Single share button in OpinionFeed

### AI Intelligence Tests
- [ ] Question-based retrieval (not category-based)
- [ ] Category variety (2 per category)
- [ ] Opinion summaries included
- [ ] WHO questions answered comprehensively
- [ ] WHAT questions answered comprehensively
- [ ] WHERE questions answered comprehensively
- [ ] WHEN questions answered comprehensively
- [ ] WHY questions answered comprehensively
- [ ] HOW questions answered comprehensively
- [ ] Multi-part questions handled
- [ ] Comparison questions handled
- [ ] Fact-checking works
- [ ] Missing information handled gracefully

### Conversation Tracking Tests
- [ ] Follow-up questions understood
- [ ] Pronoun resolution works
- [ ] Entity tracking works
- [ ] Context continuity maintained

### Edge Cases
- [ ] Empty queries handled
- [ ] Long queries handled
- [ ] Special characters handled
- [ ] No results handled
- [ ] Network errors handled

---

## 🐛 Common Issues & Troubleshooting

### Issue: Share button navigates instead of opening menu
**Fix:** Check that `e.stopPropagation()` is called in ShareButtons onClick handlers

### Issue: AI only returns Zimbabwean news
**Fix:** Verify `retrieveRelevantArticles` is using question-based scoring, not category-based

### Issue: No opinions in responses
**Fix:** Check that opinions are being passed to `generateAskPulseAIResponseStream`

### Issue: Follow-up questions not understood
**Fix:** Verify conversation history is being passed to backend proxy

### Issue: Chatbot still has grid layout
**Fix:** Check App.tsx - ensure grid wrapper is removed

---

## 📝 Reporting Test Results

After testing, document:
1. **Passed Tests:** List all tests that passed
2. **Failed Tests:** List tests that failed with details
3. **Issues Found:** Any bugs or unexpected behavior
4. **Performance Notes:** Response times, any slowness
5. **User Experience:** Overall feel of the feature

---

## 🎯 Success Criteria

The implementation is successful if:
- ✅ All UI fixes work correctly
- ✅ AI responds based on question intent, not just categories
- ✅ Category variety is evident in responses
- ✅ Opinions are included when relevant
- ✅ Conversation tracking works for follow-up questions
- ✅ All question types (WHO, WHAT, WHERE, etc.) are handled intelligently
- ✅ No crashes or errors during normal use

---

## 🚀 Next Steps After Testing

1. **If all tests pass:** Feature is ready for production
2. **If issues found:** Document and fix before deployment
3. **Performance optimization:** If responses are slow, optimize article retrieval
4. **User feedback:** Gather feedback on AI response quality

---

**Happy Testing! 🎉**
