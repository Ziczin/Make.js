export default function createCardContent(Component) {
    return class CardContent extends Component {
        constructor(...decorators) {
            super('div');
            
            this._innerContainer = new Component('div');
            
            const originalAddChild = Component.prototype.addChild;
            
            originalAddChild.call(this, this._innerContainer);
            
            decorators.forEach(d => this._innerContainer.addDecorator(d));
        }
        
        addDecorator(decorator) {
            this._innerContainer.addDecorator(decorator);
            return this;
        }
        
        addChild(...items) {
            this._innerContainer.addChild(...items);
            return this;
        }
        
        removeChild(child) {
            return this._innerContainer.removeChild(child);
        }
        
        getChild(index) {
            return this._innerContainer.getChild(index);
        }
        
        getFirstChild() {
            return this._innerContainer.getFirstChild();
        }
        
        getLastChild() {
            return this._innerContainer.getLastChild();
        }
        
        getChildren() {
            return this._innerContainer.getChildren();
        }
        
        replaceChild(newChild, oldChild) {
            return this._innerContainer.replaceChild(newChild, oldChild);
        }
        
        insertBefore(child, before) {
            return this._innerContainer.insertBefore(child, before);
        }
        
        build(force = false) {
            if (this.destroyed) {
                return null;
            }
            
            this.element.style.overflow = 'hidden';
            this.element.style.maxHeight = '0';
            this.element.style.opacity = '0';
            
            this._innerContainer.build(force);
            
            return super.build(force);
        }
        
        destroy() {
            if (this.destroyed) return;
            
            const innerContainer = this._innerContainer;
            
            if (innerContainer && !innerContainer.destroyed) {
                innerContainer.destroy();
            }
            
            super.destroy();
        }
    };
}